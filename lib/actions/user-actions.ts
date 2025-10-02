"use server";
import { createSupabaseClient } from "../supabase";

export const createUserIfNotExists = async (
  clerkUserId: string, 
  clerkUserData?: {
    username?: string | null;
    fullName?: string | null;
    imageUrl?: string | null;
    email?: string | null;
  }
) => {
  console.log("🔍 createUserIfNotExists START - clerkUserId:", clerkUserId);
  
  const supabase = createSupabaseClient();

  try {
    console.log("🔍 Executing SELECT query...");
    const { data: existingUser, error: selectError } = await supabase
      .from("users")
      .select("id, clerk_user_id, username, full_name")
      .eq("clerk_user_id", clerkUserId)
      .single();

    console.log("🔍 SELECT query completed:", { existingUser, selectError });

    if (existingUser) {
      console.log("✅ User exists, returning ID:", existingUser.id);
      return existingUser;
    }

    if (selectError && selectError.code === 'PGRST116') {
      console.log("🆕 No user found, creating new one with Clerk data...");
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({
          clerk_user_id: clerkUserId,
          username: clerkUserData?.username,
          full_name: clerkUserData?.fullName,
          avatar_url: clerkUserData?.imageUrl,
          email: clerkUserData?.email,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error("❌ INSERT ERROR:", insertError);
        throw insertError;
      }
      
      console.log("✅ New user created with Clerk data:", newUser);
      return newUser;
    }

    console.error("❌ UNEXPECTED SELECT ERROR:", selectError);
    throw selectError;

  } catch (error) {
    console.error("❌ CATCH BLOCK ERROR:", error);
    throw error;
  }
};