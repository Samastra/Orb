import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { createTemporaryBoard } from "@/lib/actions/board-actions";

export default async function NewBoardPage() {
  const user = await currentUser();
  
  try {
    const board = await createTemporaryBoard(user?.id);
    console.log("✅ BOARD CREATED SUCCESSFULLY! Redirecting to:", `/boards/${board.id}`);
    redirect(`/boards/${board.id}`);
  } catch (error) { // ← Just remove the type annotation entirely
    // Simple check for redirect error
    if (error && typeof error === 'object' && 'digest' in error) {
      console.log("🔄 Normal redirect happening");
      throw error;
    }
    
    console.error("❌ Real error creating board:", error);
    redirect("/?error=board-creation-failed");
  }
}