"use server";

import { createSupabaseClient } from "../supabase";
import { createUserIfNotExists } from "./user-actions";

export const toggleFavorite = async (clerkUserId: string, boardId: string) => {
  const supabase = createSupabaseClient();
  
  const user = await createUserIfNotExists(clerkUserId);
  
  // Check if already favorited
  const { data: existingFavorite, error: checkError } = await supabase
    .from("user_favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("board_id", boardId)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    console.error("❌ Error checking favorite:", checkError);
    throw checkError;
  }

  if (existingFavorite) {
    // Remove from favorites
    const { error: deleteError } = await supabase
      .from("user_favorites")
      .delete()
      .eq("id", existingFavorite.id);

    if (deleteError) {
      console.error("❌ Error removing favorite:", deleteError);
      throw deleteError;
    }
    
    console.log("✅ Removed from favorites");
    return false;
  } else {
    // Add to favorites
    const { error: insertError } = await supabase
      .from("user_favorites")
      .insert({
        user_id: user.id,
        board_id: boardId
      });

    if (insertError) {
      console.error("❌ Error adding favorite:", insertError);
      throw insertError;
    }
    
    console.log("✅ Added to favorites");
    return true;
  }
};

export const getUserFavorites = async (clerkUserId: string) => {
  const supabase = createSupabaseClient();
  
  const user = await createUserIfNotExists(clerkUserId);
  
  const { data, error } = await supabase
    .from("user_favorites")
    .select(`
      board:boards (
        id,
        title,
        description,
        category,
        is_public,
        created_at,
        updated_at,
        owner_id
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error fetching favorites:", error);
    throw error;
  }

  return data?.map(item => item.board) || [];
};

export const isBoardFavorited = async (clerkUserId: string, boardId: string) => {
  const supabase = createSupabaseClient();
  
  const user = await createUserIfNotExists(clerkUserId);
  
  const { data, error } = await supabase
    .from("user_favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("board_id", boardId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error("❌ Error checking if favorited:", error);
    throw error;
  }

  return !!data;
};