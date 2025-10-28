import React, { useState } from "react";
import Link from "next/link";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
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
import ChatModal from "@/components/ChatModal";
import ShareBoardModal from "@/components/enterprise/sharing/ShareBoardModal"; // NEW IMPORT
import { useUser } from "@clerk/nextjs";
import { 
  Mic, 
  MessageSquare, 
  Save, 
  UserPlus, 
  Users,
  X,
  Circle,
  MoreVertical, // NEW ICON
  Download,
  Share2,
  Camera
} from "lucide-react";

interface ReactShape {
  id: string;
  type: string;
  x: number;
  y: number;
  // Add other properties as needed
}

interface KonvaShape {
  id: string;
  type: string;
  // Add other properties as needed  
}

interface ImageShape {
  id: string;
  type: 'image';
  src: string;
  // Add other properties as needed
}

interface Connection {
  id: string;
  // Add other properties as needed
}


interface BoardHeaderProps {
  boardInfo: { title: string; category: string };
  isTemporaryBoard: boolean;
  currentBoardId: string;
  showSaveModal: boolean;
  setShowSaveModal: (show: boolean) => void;
  handleCloseWithoutSave: () => void;
  onAddImageFromRecommendations?: (imageUrl: string, altText: string) => void;
  onPlayVideo?: (videoId: string, title: string) => void;
  boardElements?: {
    reactShapes: ReactShape[];
    konvaShapes: KonvaShape[];
    stageFrames: KonvaShape[];
    images: ImageShape[];
    connections: Connection[];
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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false); // NEW STATE
  const [isMenuOpen, setIsMenuOpen] = useState(false); // NEW STATE

  return (
    <>
      <section className="flex items-center justify-between gap-4">
        <div className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between bg-white/95 backdrop-blur-sm px-6 py-4 shadow-lg border-b border-gray-200/80">
          <div className="flex items-center gap-4">
            {/* UPDATED MENU BUTTON WITH DROPDOWN */}
            <div className="relative">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100/80 transition-all duration-300"
              >
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>
              
              {/* DROPDOWN MENU */}
              {isMenuOpen && (
                <div className="absolute left-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  <button 
                    onClick={() => {
                      setIsShareModalOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share Board</span>
                  </button>
                  
                  <button 
                    onClick={() => {
                      // Placeholder for download functionality
                      console.log("Download board");
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Board</span>
                  </button>
                  
                  <button 
                    onClick={() => {
                      // Placeholder for snapshot functionality
                      console.log("Send snapshot");
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Send Snapshot</span>
                  </button>
                </div>
              )}
            </div>

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
          <div className="flex items-center gap-3">
            <button className="flex items-center justify-center w-10 h-10 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 group">
              <Mic className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
            </button>
            <Sheet>
              <SheetTrigger asChild>
                <button className="flex items-center justify-center w-10 h-10 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 group">
                  <MessageSquare className="w-4 h-4 text-gray-600 group-hover:text-purple-600" />
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
                  onPlayVideo={onPlayVideo}
                />
              </SheetContent>
            </Sheet>
            <Button
              onClick={() => setIsChatOpen(true)}
              className="flex items-center justify-center w-10 h-10 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 group"
            >
              <MessageSquare className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
            </Button>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-100/80 rounded-xl border border-gray-200">
              <div className="flex items-center gap-1.5">
                <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                <span className="text-sm font-medium text-gray-700">Solo</span>
              </div>
            </div>
            {isTemporaryBoard && (
              <Button 
                onClick={handleCloseWithoutSave}
                variant="ghost"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl px-3 py-2 transition-all duration-300"
              >
                <X className="w-4 h-4 mr-2" />
                Close
              </Button>
            )}
            <Button
              variant="outline"
              className="border-green-500 text-green-600 hover:bg-green-50 hover:border-green-600 rounded-xl px-4 py-2 transition-all duration-300 group"
            >
              <UserPlus className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
              Invite
            </Button>
            <Button  
              onClick={() => {
                console.log("🔄 Save button clicked - currentBoardId:", currentBoardId);
                console.log("🔄 Save button clicked - showSaveModal will be:", !showSaveModal);
                setShowSaveModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 transition-all duration-300 shadow-sm hover:shadow-md group"
            >
              <Save className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
              Save Board
            </Button>
            <Link href="/dashboard">
              <Avatar className="h-10 w-10 rounded-xl border-2 border-gray-200/80 hover:border-blue-500 transition-all duration-300 hover:scale-105">
                <AvatarImage src={user?.imageUrl} alt={user?.fullName || " "} />
                <AvatarFallback className="rounded-xl bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 font-medium">
                  {user?.fullName?.split(" ")
                    .map((word: string) => word.charAt(0).toUpperCase())
                    .join("")
                  }
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </section>
      
      {/* MODALS */}
      <SaveBoardModal 
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        tempBoardId={currentBoardId}
        boardElements={boardElements}
      />
      
      <ChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />

      {/* NEW SHARE MODAL */}
      <ShareBoardModal 
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        boardId={currentBoardId}
        boardTitle={boardInfo.title}
      />
    </>
  );
};

export default BoardHeader;