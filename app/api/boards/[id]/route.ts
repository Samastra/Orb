import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ← params is a Promise
) {
  try {
    const { id } = await params; // ← Await the params first!
    const boardId = id;

    if (!boardId) {
      return NextResponse.json(
        { error: "Board ID is required" },
        { status: 400 }
      );
    }

    // Fetch board from Supabase
    const { data: board, error } = await supabase
      .from("boards")
      .select("id, title, is_temporary, owner_id, created_at")
      .eq("id", boardId)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Board not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: board.id,
      title: board.title,
      is_temporary: board.is_temporary || false,
      owner_id: board.owner_id,
      created_at: board.created_at
    });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}