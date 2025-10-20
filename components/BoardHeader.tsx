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
  onAddImageFromRecommendations?: (imageUrl: string, altText: string) => void;
  onPlayVideo?: (videoId: string, title: string) => void;
  // ADD THIS PROP
  boardElements?: {
    reactShapes: any[];
    konvaShapes: any[];
    stageFrames: any[];
    images: any[];
    connections: any[];
  };
}



const BoardHeader: React.FC<BoardHeaderProps> = ({
  boardInfo,
  isTemporaryBoard,
  currentBoardId,
  showSaveModal,
  setShowSaveModal,
  handleCloseWithoutSave,
  onAddImageFromRecommendations,
  onPlayVideo, 
  boardElements
}) => {
  const { user } = useUser();

  return (
    <>
      <section className="flex items-center justify-between gap-4">
        {/* Premium Glass Morphism Header */}
        <div className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between bg-white/95 backdrop-blur-sm px-6 py-4 shadow-lg border-b border-gray-200/80">
          
          {/* Left Section - Brand & Board Info */}
          <div className="flex items-center gap-4">
            {/* Menu Button */}
            <button className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100/80 transition-all duration-300">
              <img src="/image/three-dots-vertical.svg" alt="Menu" className="w-5 h-5" />
            </button>
            
            {/* Brand & Board Title */}
            <div className="flex items-center gap-3">
              <Link 
                href={"/"} 
                className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent hover:from-blue-700 hover:to-blue-900 transition-all duration-300"
              >
                Orb
              </Link>
              <div className="w-px h-6 bg-gray-300/80"></div>
              <div className="flex items-center gap-2">
                <p className="text-gray-700 font-medium">
                  {boardInfo.title}
                </p>
                {boardInfo.category && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500 text-sm bg-gray-100/80 px-2 py-1 rounded-lg">
                      {boardInfo.category}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Right Section - Controls & User */}
          <div className="flex items-center gap-3">
            {/* Microphone */}
            <button className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100/80 transition-all duration-300">
              <img src="/image/mic.svg" alt="microphone" className="w-5 h-5" />
            </button>
            
            {/* AI Recommendations - WIDER SHEET */}
            <Sheet>
              <SheetTrigger asChild>
                <button className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100/80 transition-all duration-300">
                  <img src="/image/review-bubble.svg" alt="recommendations" className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent 
                side="right" 
                className="w-[480px] sm:w-[520px] bg-white/95 backdrop-blur-sm border-l border-gray-200/80 p-0 overflow-hidden"
              >
                <SheetHeader className="sr-only">
                  <SheetTitle>AI Recommendations</SheetTitle>
                </SheetHeader>
               <ResourceList 
          boardTitle={boardInfo.title}
          boardCategory={boardInfo.category}
          onAddToBoard={onAddImageFromRecommendations}
          onPlayVideo={onPlayVideo} // ← USE THE PROP
        />
              </SheetContent>
            </Sheet>

            {/* Close without Save for temporary boards */}
            {isTemporaryBoard && (
              <Button 
                onClick={handleCloseWithoutSave} 
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl px-4 py-2 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Close Without Save
              </Button>
            )}
            
            {/* Save Board Button */}
            <Button  
              onClick={() => {
                console.log("🔄 Save button clicked - currentBoardId:", currentBoardId);
                console.log("🔄 Save button clicked - showSaveModal will be:", !showSaveModal);
                setShowSaveModal(true);
              }}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl px-4 py-2 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Save Board
            </Button>
            
            {/* Invite Button */}
            <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl px-4 py-2 transition-all duration-300 shadow-md hover:shadow-lg">
              Invite
            </Button>
            
            {/* Solo Button */}
            <Button className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl px-4 py-2 transition-all duration-300 shadow-md hover:shadow-lg">
              Solo
            </Button>
            
            {/* User Avatar */}
            <Link href="/dashboard">
              <Avatar className="h-10 w-10 rounded-xl border-2 border-gray-200/80 hover:border-blue-500 transition-all duration-300 hover:scale-105">
                <AvatarImage src={user?.imageUrl} alt={user?.fullName || " "} />
                <AvatarFallback className="rounded-xl bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 font-medium">
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

      {/* Save Board Modal - UNCHANGED */}
     <SaveBoardModal 
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        tempBoardId={currentBoardId}
        boardElements={boardElements} // PASS THE ELEMENTS HERE
      />
    </>
  );
};

export default BoardHeader;