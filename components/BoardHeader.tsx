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
import ShareBoardModal from "@/components/enterprise/sharing/ShareBoardModal";
import CreateBoard from "@/components/createBoard"; // USE EXISTING COMPONENT
import { useUser } from "@clerk/nextjs";
import { 
  Mic, 
  MessageSquare, 
  Save, 
  UserPlus,
  X,
  Circle,
  MoreVertical,
  Download,
  Share2,
  Camera,
  Sparkles,
  FileImage,
  FileText,
  Image,
  Edit3
} from "lucide-react";
import type { ReactShape, ImageShape, Connection } from "@/types/board-types";
import type { KonvaShape } from "@/hooks/useShapes";
import { downloadAsImage, downloadAsPDF } from "@/lib/download-utils";

// Add Konva import
import type Konva from "konva";

interface BoardHeaderProps {
  boardInfo: { title: string; category: string };
  isTemporaryBoard: boolean;
  currentBoardId: string;
  showSaveModal: boolean;
  stageRef?: React.RefObject<Konva.Stage | null>;
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
    stageState: { scale: number; position: { x: number; y: number } }; // ← Add stageState here
  };
  onBoardUpdate?: (updates: { title: string; category: string }) => void;
  onOpenWebsite?: (url: string, title: string) => void;
  onCopyCleanText?: () => Promise<void>;
  scale: number;
  position: { x: number; y: number };
}

const BoardHeader: React.FC<BoardHeaderProps> = ({
  boardInfo,
  isTemporaryBoard,
  currentBoardId,
  showSaveModal,
  stageRef,
  setShowSaveModal,
  handleCloseWithoutSave,
  onAddImageFromRecommendations,
  onPlayVideo, 
  boardElements,
  onOpenWebsite,
  onBoardUpdate,
  onCopyCleanText,
  scale,
  position
}) => {
  const { user } = useUser();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDownloadSubmenuOpen, setIsDownloadSubmenuOpen] = useState(false);
  const [isEditBoardModalOpen, setIsEditBoardModalOpen] = useState(false); // CHANGED TO USE CREATEBOARD

  const handleDownload = async (format: 'png' | 'jpeg' | 'pdf'): Promise<void> => {
    setIsMenuOpen(false);
    setIsDownloadSubmenuOpen(false);
    
    try {
      const stage = stageRef?.current;
      
      if (!stage) {
        console.error('Stage not found');
        return;
      }

      switch (format) {
        case 'png':
          downloadAsImage(stage, 'png');
          break;
        case 'jpeg':
          downloadAsImage(stage, 'jpeg');
          break;
        case 'pdf':
          downloadAsPDF(stage);
          break;
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <>
      <section className="flex items-center justify-between gap-4">
        <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between bg-white/95 backdrop-blur-sm px-6 py-4 shadow-lg border-b border-gray-200/80">
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100/80 transition-all duration-300"
              >
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>
              
              {isMenuOpen && (
                <div className="absolute left-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
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
                  
                  {/* Download with Submenu */}
                  <div className="relative">
                    <button 
                      onClick={() => setIsDownloadSubmenuOpen(!isDownloadSubmenuOpen)}
                      className="flex items-center justify-between w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Download className="w-4 h-4" />
                        <span>Download Board</span>
                      </div>
                      <span className="text-xs">▶</span>
                    </button>
                    
                    {/* Download Submenu */}
                    {isDownloadSubmenuOpen && (
                      <div className="absolute left-full top-0 ml-1 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
                        <button 
                          onClick={() => handleDownload('png')}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <FileImage className="w-4 h-4" />
                          <span>Download as PNG</span>
                        </button>
                        <button 
                          onClick={() => handleDownload('jpeg')}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Image className="w-4 h-4" />
                          <span>Download as JPEG</span>
                        </button>
                        <button 
                          onClick={() => handleDownload('pdf')}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Download as PDF</span>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => {
                      console.log("Send snapshot");
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    title="Coming soon"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Send Snapshot</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Orblin
              </div>
              <div className="w-px h-6 bg-gray-300/80"></div>
              <div className="flex items-center gap-2 group">
                {/* EDITABLE TITLE SECTION - UPDATED TO USE CREATEBOARD */}
                <button
                  onClick={() => setIsEditBoardModalOpen(true)}
                  className="flex items-center gap-2 hover:bg-gray-100/80 rounded-lg px-2 py-1 transition-all duration-300 group"
                  title="Edit board title"
                >
                  <p className="text-gray-700 font-medium">
                    {boardInfo.title}
                  </p>
                  <Edit3 className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
                
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

                {onCopyCleanText && (
              <button 
                onClick={onCopyCleanText}
                className="flex items-center justify-center w-10 h-10 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 group"
                title="Copy all text as clean text"
              >
                <FileText className="w-4 h-4 text-gray-600 group-hover:text-green-600" />
              </button>
            )}


            <button 
              className="flex items-center justify-center w-10 h-10 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 group"
              title="stream feature - Coming soon"
            >
              <Mic className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
            </button>
            
            <Sheet>
              <SheetTrigger asChild>
                <button className="flex items-center justify-center w-10 h-10 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 group">
                  <Sparkles className="w-4 h-4 text-gray-600 group-hover:text-purple-600" />
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
                  onOpenWebsite={onOpenWebsite} 
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
              title="Invite collaborators - Coming soon"
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

      <ShareBoardModal 
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        boardId={currentBoardId}
        boardTitle={boardInfo.title}
      />

      {/* USE THE EXISTING CREATEBOARD MODAL FOR EDITING */}
      <CreateBoard 
        open={isEditBoardModalOpen}
        onOpenChange={setIsEditBoardModalOpen}
        boardId={currentBoardId}
        initialData={{
          title: boardInfo.title,
          category: boardInfo.category
        }}
        onBoardUpdate={(updates) => {
          console.log("🔄 Board info updated from edit modal:", updates);
          if (onBoardUpdate) {
            onBoardUpdate(updates);
          }
          setIsEditBoardModalOpen(false);
        }}
      />
    </>
  );
};

export default BoardHeader;