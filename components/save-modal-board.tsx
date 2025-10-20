"use client";
import { useUser, useClerk } from "@clerk/nextjs";
import { SignIn, SignUp } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { saveAnonymousBoard } from "@/lib/actions/board-actions";
import { saveBoardElements } from "@/lib/actions/board-elements-actions"; // ADD THIS

// IN components/save-modal-board.tsx - UPDATE THE INTERFACE
// IN components/save-modal-board.tsx - UPDATE THE INTERFACE
interface SaveBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  tempBoardId: string;
  boardElements?: {
    reactShapes: any[];
    konvaShapes: any[];
    stageFrames: any[];
    images: any[];
    connections: any[];
    stageState?: { // MAKE THIS OPTIONAL with ?
      scale: number;
      position: { x: number; y: number };
    };
  };
}

export default function SaveBoardModal({ 
  isOpen, 
  onClose, 
  tempBoardId,
  boardElements // ADD THIS PROP
}: SaveBoardModalProps) {
  const { isSignedIn, user } = useUser();
  const { openSignIn, openSignUp } = useClerk();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // ADD LOADING STATE

  console.log("🔍 Modal received tempBoardId:", tempBoardId);

  // Handle save after user authenticates
  useEffect(() => {
    if (isSignedIn && user && isOpen) {
      handleSaveAfterAuth();
    }
  }, [isSignedIn, user, isOpen]);

  // IN components/save-modal-board.tsx - UPDATE handleSaveAfterAuth
// IN components/save-modal-board.tsx - UPDATE handleSaveAfterAuth
// IN components/save-modal-board.tsx - UPDATE handleSaveAfterAuth
const handleSaveAfterAuth = async () => {
  if (!user) return;
  
  setIsSaving(true);
  try {
    // 1. Save board metadata
    await saveAnonymousBoard(tempBoardId, user.id);
    
    // 2. Save board elements if they exist
    if (boardElements) {
      // Provide default stage state if missing
      const stageState = boardElements.stageState || { scale: 1, position: { x: 0, y: 0 } };
      
      await saveBoardElements(
        tempBoardId, 
        {
          reactShapes: boardElements.reactShapes,
          konvaShapes: boardElements.konvaShapes,
          stageFrames: boardElements.stageFrames,
          images: boardElements.images,
          connections: boardElements.connections
        },
        stageState, // USE THE STAGE STATE (WITH FALLBACK)
        user.id
      );
    }
    
    onClose();
    alert("Board saved successfully!");
  } catch (error: any) {
    console.error("Failed to save board:", error);
    alert(`Failed to save board: ${error.message || 'Unknown error'}`);
  } finally {
    setIsSaving(false);
  }
};

  const handleAuthClick = () => {
    if (isSignUp) {
      openSignUp();
    } else {
      openSignIn();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md">
        <h2 className="text-xl font-bold mb-4">Save Your Board</h2>
        
        {!isSignedIn ? (
          <div>
            <p className="mb-4">Sign in to save your work permanently</p>
            
            <button 
              onClick={handleAuthClick}
              className="bg-blue-500 text-white px-4 py-2 rounded w-full mb-4"
            >
              {isSignUp ? "Sign Up" : "Sign In"}
            </button>
            
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-500"
            >
              {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
            </button>
          </div>
        ) : (
          <div>
            <p>Ready to save your board?</p>
            <button 
              onClick={handleSaveAfterAuth}
              disabled={isSaving}
              className="bg-blue-500 text-white px-4 py-2 rounded mt-4 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Board"}
            </button>
          </div>
        )}
        
        <button onClick={onClose} className="mt-4 text-gray-500">
          Cancel
        </button>
      </div>
    </div>
  );
}