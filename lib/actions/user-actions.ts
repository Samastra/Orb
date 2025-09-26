"use server";
import { createSupabaseClient } from "../supabase";

export const createUserIfNotExists = async (clerkUserId: string) => {
  console.log("🔍 createUserIfNotExists START - clerkUserId:", clerkUserId, "type:", typeof clerkUserId);
  
  const supabase = createSupabaseClient();

  try {
    console.log("🔍 Executing SELECT query...");
    const { data: existingUser, error: selectError } = await supabase
      .from("users")
      .select("id, clerk_user_id")
      .eq("clerk_user_id", clerkUserId)
      .single();

    console.log("🔍 SELECT query completed:", { existingUser, selectError });

    if (existingUser) {
      console.log("✅ User exists, returning ID:", existingUser.id);
      return existingUser;
    }

    if (selectError && selectError.code === 'PGRST116') {
      console.log("🆕 No user found, creating new one...");
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({
          clerk_user_id: clerkUserId,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error("❌ INSERT ERROR:", insertError);
        throw insertError;
      }
      
      console.log("✅ New user created:", newUser.id);
      return newUser;
    }

    console.error("❌ UNEXPECTED SELECT ERROR:", selectError);
    throw selectError;

  } catch (error) {
    console.error("❌ CATCH BLOCK ERROR:", error);
    throw error;
  }
};