"use server";
import { createSupabaseClient } from "../supabase";
import { createUserIfNotExists } from "./user-actions";

export const saveAnonymousBoard = async (tempBoardId: string, clerkUserId: string) => {
  console.log("=== DEBUG SAVE ANONYMOUS BOARD ===");
  console.log("tempBoardId:", tempBoardId, "type:", typeof tempBoardId);
  console.log("clerkUserId:", clerkUserId, "type:", typeof clerkUserId);
  
  const supabase = createSupabaseClient();
  
  // 1. Create user record
  const user = await createUserIfNotExists(clerkUserId);
  console.log("User from createUserIfNotExists:", user);
  console.log("User ID (for owner_id):", user.id, "type:", typeof user.id);
  
  // 2. Link board to user
  console.log("Updating board with owner_id:", user.id);
  
  const { data: board, error } = await supabase
    .from("boards")
    .update({ 
      owner_id: user.id,
      is_temporary: false 
    })
    .eq("id", tempBoardId)
    .select()
    .single();

  if (error) {
    console.error("❌ SUPABASE UPDATE ERROR DETAILS:");
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    console.error("Error details:", error.details);
    throw error;
  }
  
  console.log("✅ Board updated successfully:", board);
  return board;
};

export const createNewBoard = async (clerkUserId: string, boardData: any) => {
  const supabase = createSupabaseClient();
  
  // 1. Get or create user
  const user = await createUserIfNotExists(clerkUserId);
  
  // 2. Create new board for authenticated user
  const { data: board, error } = await supabase
    .from("boards")
    .insert({
      ...boardData,
      owner_id: user.id,
      is_temporary: false
    })
    .select()
    .single();

  if (error) throw error;
  return board;
};


export const createTemporaryBoard = async (clerkUserId?: string) => {  // ← Add optional parameter
  const supabase = createSupabaseClient();
  
  let ownerId = null;
  let isTemporary = true;
  
  if (clerkUserId) {
    console.log("User is authenticated:", clerkUserId);
    const supabaseUser = await createUserIfNotExists(clerkUserId);
    ownerId = supabaseUser.id;
    isTemporary = false;
  }

  const { data: board, error } = await supabase
    .from("boards")
    .insert({
      title: "Untitled Board",
      owner_id: ownerId,
      is_temporary: isTemporary,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return board;
};
export const deleteBoard = async (boardId: string) => {
  const supabase = createSupabaseClient();
  
  const { error } = await supabase
    .from("boards")
    .delete()
    .eq("id", boardId);

  if (error) throw error;
};