import React from "react";
import Link from "next/link";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import ResourceList from "@/components/ResourceList";
import SaveBoardModal from "@/components/save-modal-board";
import { useUser } from "@clerk/nextjs";

interface BoardHeaderProps {
  boardInfo: { title: string; category: string };
  isTemporaryBoard: boolean;
  currentBoardId: string;
  showSaveModal: boolean;
  setShowSaveModal: (show: boolean) => void;
  handleCloseWithoutSave: () => void;
}

const BoardHeader: React.FC<BoardHeaderProps> = ({
  boardInfo,
  isTemporaryBoard,
  currentBoardId,
  showSaveModal,
  setShowSaveModal,
  handleCloseWithoutSave,
}) => {
  const { user } = useUser();

  return (
    <>
      <section className="flex items-center justify-between gap-4">
        <div className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between bg-white px-6 py-3 shadow-md">
          <div className="flex items-center gap-3">
            {/* Menu */}
            <button>
              <img src="/image/three-dots-vertical.svg" alt="Menu" />
            </button>
            <Link href={"/"}>Orb</Link>
            <p>- {boardInfo.title}{boardInfo.category ? ` (${boardInfo.category})` : ""}</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Microphone */}
            <button>
              <img src="/image/mic.svg" alt="microphone" />
            </button>
            
            {/* Recommendations */}
            <Sheet>
              <SheetTrigger asChild>
                <button>
                  <img src="/image/review-bubble.svg" alt="recommendations" />
                </button>
              </SheetTrigger>
              <SheetContent className="">
                <SheetHeader>
                  <SheetTitle>
                    <p className="font-bold text-lg mb-4">AI Recommendations</p>
                  </SheetTitle>
                </SheetHeader>
                <ResourceList />
              </SheetContent>
            </Sheet>

            {/* Close without Save for temporary boards */}
            {isTemporaryBoard && (
              <Button onClick={handleCloseWithoutSave} className="bg-red-500 text-white">
                Close 
              </Button>
            )}
            
            {/* Save Board */}
            <Button  
              onClick={() => {
                console.log("🔄 Save button clicked - currentBoardId:", currentBoardId);
                console.log("🔄 Save button clicked - showSaveModal will be:", !showSaveModal);
                setShowSaveModal(true);
              }}
            >
              save board
            </Button>
            
            {/* Invite & Solo */}
            <Button>Invite</Button>
            <Button>Solo</Button>
            
            {/* User Avatar */}
            <Link href="/dashboard">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user?.imageUrl} alt={user?.fullName || " "} />
                <AvatarFallback className="rounded-lg">
                  {user?.fullName?.split(" ")
                    .map((word: any) => word.charAt(0).toUpperCase())
                    .join("")
                  }
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </section>

      {/* Save Board Modal */}
      <SaveBoardModal 
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        tempBoardId={currentBoardId}
      />
    </>
  );
};

export default BoardHeader;