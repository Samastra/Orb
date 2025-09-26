import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { createTemporaryBoard } from "@/lib/actions/board-actions";

export default async function NewBoardPage() {
  const user = await currentUser();
  
  try {
    const board = await createTemporaryBoard(user?.id);
    console.log("✅ BOARD CREATED SUCCESSFULLY! Redirecting to:", `/boards/${board.id}`);
    redirect(`/boards/${board.id}`);
  } catch (error: any) {
    // Check if this is a redirect error (normal) or a real error
    if (error.digest?.includes('NEXT_REDIRECT')) {
      console.log("🔄 Normal redirect happening");
      throw error; // Re-throw redirect errors
    }
    
    console.error("❌ Real error creating board:", error);
    redirect("/?error=board-creation-failed");
  }
}