"use server";
import { createSupabaseClient } from "../supabase";
import { createUserIfNotExists } from "./user-actions";

export const fetchBoard = async (boardId: string) => {
  const supabase = createSupabaseClient();
  
  const { data: board, error } = await supabase
    .from("boards")
    .select("id, title, is_temporary, owner_id, created_at")
    .eq("id", boardId)
    .single();

  if (error) throw error;
  return board;
};

export const saveAnonymousBoard = async (tempBoardId: string, clerkUserId: string) => {
  console.log("🔍 saveAnonymousBoard called with:", { tempBoardId, clerkUserId });
  
  const supabase = createSupabaseClient();

  try {
    // 1. Create user record
    console.log("🔄 Step 1: Getting/Creating user...");
    const user = await createUserIfNotExists(clerkUserId);
    console.log("✅ User obtained:", user.id);

    // 2. Link board to user
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

export const updateBoard = async (boardId: string, updates: {
  title?: string;
  is_public?: boolean;
  category?: string;
}) => {
  console.log("🔄 updateBoard called with:", { boardId, updates });
  
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from("boards")
    .update(updates)
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
  const supabase = createSupabaseClient()
  
  // Convert Clerk ID to Supabase ID with user data
  const user = await createUserIfNotExists(clerkUserId, clerkUserData)
  
  const { data, error } = await supabase
    .from("boards")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export const getPublicBoards = async () => {
  const supabase = createSupabaseClient()
  
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
    .limit(10)

  if (error) throw error
  return data
}

