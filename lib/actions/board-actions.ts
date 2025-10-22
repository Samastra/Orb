"use server";

import { createSupabaseClient } from "../supabase";
import { createUserIfNotExists } from "./user-actions";

export const fetchBoard = async (boardId: string) => {
  const supabase = createSupabaseClient();
  
  console.log("📥 Fetching board:", boardId);
  const { data: board, error } = await supabase
    .from("boards")
    .select("id, title, category, is_temporary, owner_id, created_at")
    .eq("id", boardId)
    .single();

  if (error) {
    console.error("❌ Error fetching board:", error);
    throw error;
  }

  if (!board) {
    console.error("❌ No board found for ID:", boardId);
    throw new Error("Board not found");
  }

  console.log("✅ Board fetched:", board);
  return board;
};

export const saveAnonymousBoard = async (tempBoardId: string, clerkUserId: string) => {
  console.log("🔍 saveAnonymousBoard called with:", { tempBoardId, clerkUserId });
  
  const supabase = createSupabaseClient();

  try {
    console.log("🔄 Step 1: Getting/Creating user...");
    const user = await createUserIfNotExists(clerkUserId);
    console.log("✅ User obtained:", user.id);

    console.log("🔄 Step 2: Updating board with owner_id:", user.id);
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
      console.error("❌ Supabase update error:", error);
      throw error;
    }

    console.log("✅ Board updated successfully:", board);
    return board;
  } catch (error) {
    console.error("❌ saveAnonymousBoard full error:", error);
    throw error;
  }
};

export const createNewBoard = async (clerkUserId: string, boardData: any) => {
  const supabase = createSupabaseClient();
  
  const user = await createUserIfNotExists(clerkUserId);
  
  const { data: board, error } = await supabase
    .from("boards")
    .insert({
      ...boardData,
      owner_id: user.id,
      is_temporary: false
    })
    .select()
    .single();

  if (error) {
    console.error("❌ Error creating board:", error);
    throw error;
  }

  console.log("✅ Board created:", board);
  return board;
};

export const createTemporaryBoard = async (clerkUserId?: string) => {
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

  if (error) {
    console.error("❌ Error creating temporary board:", error);
    throw error;
  }

  console.log("✅ Temporary board created:", board);
  return board;
};

export const deleteBoard = async (boardId: string) => {
  const supabase = createSupabaseClient();
  
  console.log("🗑️ Deleting board:", boardId);
  const { error } = await supabase
    .from("boards")
    .delete()
    .eq("id", boardId);

  if (error) {
    console.error("❌ Error deleting board:", error);
    throw error;
  }

  console.log("✅ Board deleted:", boardId);
};

export const updateBoard = async (boardId: string, updates: {
  title?: string;
  is_public?: boolean;
  category?: string;
}) => {
  console.log("🔄 updateBoard called with:", { boardId, updates });
  
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from("boards")
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq("id", boardId)
    .select()
    .single();

  if (error) {
    console.error("❌ Supabase error:", error);
    throw error;
  }
  
  console.log("✅ Board updated successfully:", data);
  return data;
};

export const getUserBoards = async (
  clerkUserId: string, 
  clerkUserData?: any
) => {
  const supabase = createSupabaseClient();
  
  const user = await createUserIfNotExists(clerkUserId, clerkUserData);
  
  const { data, error } = await supabase
    .from("boards")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error fetching user boards:", error);
    throw error;
  }

  console.log("✅ User boards fetched:", data.length);
  return data;
};

export const getPublicBoards = async () => {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from("boards")
    .select(`
      *,
      users:owner_id (
        username,
        full_name,
        avatar_url
      )
    `)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("❌ Error fetching public boards:", error);
    throw error;
  }

  console.log("✅ Public boards fetched:", data.length);
  return data;
};