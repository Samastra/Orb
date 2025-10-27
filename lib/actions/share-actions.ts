"use server";

import { createSupabaseClient } from "../supabase";
import { createUserIfNotExists } from "./user-actions";
import { Resend } from "resend";
import { randomBytes } from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

export const inviteToBoard = async (
  clerkUserId: string,
  boardId: string,
  recipientEmail: string,
  permissionLevel: "viewer" | "editor" | "admin" = "viewer",
  customMessage?: string
) => {
  const supabase = createSupabaseClient();
  
  const inviter = await createUserIfNotExists(clerkUserId);
  
  // Generate unique token for magic link
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  // Create invitation
  const { data: invitation, error } = await supabase
    .from("board_invitations")
    .insert({
      board_id: boardId,
      inviter_id: inviter.id,
      recipient_email: recipientEmail,
      token: token,
      permission_level: permissionLevel,
      expires_at: expiresAt.toISOString()
    })
    .select(`
      *,
      boards (title),
      inviter:users (full_name, username)
    `)
    .single();

  if (error) {
    console.error("❌ Error creating invitation:", error);
    throw error;
  }

  // Send email
  try {
    await sendInvitationEmail({
      to: recipientEmail,
      boardTitle: invitation.boards.title,
      inviterName: invitation.inviter.full_name || invitation.inviter.username,
      customMessage,
      token: invitation.token
    });
  } catch (emailError) {
    console.error("❌ Error sending email:", emailError);
    // Don't throw - invitation is still created
  }

  return invitation;
};

export const generatePublicLink = async (clerkUserId: string, boardId: string, isPublic: boolean) => {
  const supabase = createSupabaseClient();
  
  const user = await createUserIfNotExists(clerkUserId);
  
  // Verify user owns the board
  const { data: board, error: boardError } = await supabase
    .from("boards")
    .select("owner_id")
    .eq("id", boardId)
    .single();

  if (boardError || board.owner_id !== user.id) {
    throw new Error("Not authorized");
  }

  // Update board public status
  const { error } = await supabase
    .from("boards")
    .update({ is_public: isPublic })
    .eq("id", boardId);

  if (error) {
    console.error("❌ Error updating board visibility:", error);
    throw error;
  }

  return { 
    publicUrl: isPublic ? `${process.env.NEXT_PUBLIC_APP_URL}/boards/${boardId}` : null 
  };
};

const sendInvitationEmail = async ({
  to,
  boardTitle,
  inviterName,
  customMessage,
  token
}: {
  to: string;
  boardTitle: string;
  inviterName: string;
  customMessage?: string;
  token: string;
}) => {
  const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invite?token=${token}`;
  
  const { data, error } = await resend.emails.send({
    from: 'Orb Brainstorming <onboarding@resend.dev>',
    to,
    subject: `${inviterName} invited you to collaborate on ${boardTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚀 You're Invited!</h1>
            </div>
            <div class="content">
              <h2>${inviterName} invited you to collaborate</h2>
              <p>You've been invited to collaborate on the board: <strong>${boardTitle}</strong></p>
              
              ${customMessage ? `<blockquote style="background: #e8f4fd; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0;">${customMessage}</blockquote>` : ''}
              
              <p>Click the button below to accept the invitation and start collaborating:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${acceptUrl}" class="button">Accept Invitation</a>
              </div>
              
              <p><small>This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.</small></p>
            </div>
            <div class="footer">
              <p>Sent from Orb Brainstorming</p>
            </div>
          </div>
        </body>
      </html>
    `
  });

  if (error) {
    throw error;
  }

  return data;
};



export const getInvitationByToken = async (token: string) => {
  const supabase = createSupabaseClient();
  
  const { data: invitation, error } = await supabase
    .from("board_invitations")
    .select(`
      *,
      boards (id, title, owner_id),
      inviter:users (full_name, username, email)
    `)
    .eq("token", token)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .single();

  if (error) {
    console.error("❌ Error fetching invitation:", error);
    throw error;
  }

  return invitation;
};

export const acceptInvitation = async (clerkUserId: string, token: string) => {
  const supabase = createSupabaseClient();
  
  const user = await createUserIfNotExists(clerkUserId);
  
  // Get and verify invitation
  const invitation = await getInvitationByToken(token);
  
  if (!invitation) {
    throw new Error("Invalid or expired invitation");
  }

  // Add user as collaborator
  const { error: collaboratorError } = await supabase
    .from("board_collaborators")
    .insert({
      board_id: invitation.board_id,
      user_id: user.id,
      permission_level: invitation.permission_level,
      invited_by: invitation.inviter_id
    });

  if (collaboratorError) {
    console.error("❌ Error adding collaborator:", collaboratorError);
    throw collaboratorError;
  }

  // Mark invitation as accepted
  const { error: updateError } = await supabase
    .from("board_invitations")
    .update({ status: "accepted" })
    .eq("id", invitation.id);

  if (updateError) {
    console.error("❌ Error updating invitation:", updateError);
    throw updateError;
  }

  return {
    boardId: invitation.board_id,
    boardTitle: invitation.boards.title
  };
};