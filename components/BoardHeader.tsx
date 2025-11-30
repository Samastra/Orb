"use client";

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
import CreateBoard from "@/components/createBoard"; 
import { useUser } from "@clerk/nextjs";
import { 
  Mic, 
  MessageSquare, 
  Save, 
  X,
  MoreVertical,
  Download,
  Share2,
  Camera,
  Sparkles,
  FileImage,
  FileText,
  Image as ImageIcon, 
  Edit3,
  Copy,
  ChevronRight
} from "lucide-react";
import type { ReactShape, ImageShape, Connection } from "@/types/board-types";
import type { KonvaShape } from "@/hooks/useShapes";
import { downloadAsImage, downloadAsPDF } from "@/lib/download-utils";
import { cn } from "@/lib/utils";

import type Konva from "konva";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from "@/components/ui/dropdown-menu";

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
    stageState?: { scale: number; position: { x: number; y: number } }; 
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
  const [isEditBoardModalOpen, setIsEditBoardModalOpen] = useState(false); 

  const handleDownload = async (format: 'png' | 'jpeg' | 'pdf'): Promise<void> => {
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

  // Helper for consistent icon button styling
  const HeaderIconButton = ({ icon: Icon, onClick, className, title }: any) => (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center justify-center w-9 h-9 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-all duration-200",
        className
      )}
      title={title}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <>
      {/* Floating Header Container 
        - Detached from top (top-4)
        - Detached from sides (left-4 right-4)
        - Glassmorphism effects
      */}
      <header className="fixed top-4 left-4 right-4 z-40 flex items-center justify-between bg-white/90 backdrop-blur-xl px-4 py-2 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/20 ring-1 ring-black/5">
        
        {/* LEFT SECTION: Menu, Logo, Title */}
        <div className="flex items-center gap-3">
          
          {/* Main Menu Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors outline-none">
                <MoreVertical className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-xl ml-2">
              <DropdownMenuItem onClick={() => setIsShareModalOpen(true)} className="gap-2 cursor-pointer py-2.5">
                <Share2 className="w-4 h-4" />
                Share Board
              </DropdownMenuItem>
              
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="gap-2 cursor-pointer py-2.5">
                  <Download className="w-4 h-4" />
                  Download Board
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-xl">
                  <DropdownMenuItem onClick={() => handleDownload('png')} className="gap-2 cursor-pointer">
                    <FileImage className="w-4 h-4" /> PNG Image
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownload('jpeg')} className="gap-2 cursor-pointer">
                    <ImageIcon className="w-4 h-4" /> JPEG Image
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownload('pdf')} className="gap-2 cursor-pointer">
                    <FileText className="w-4 h-4" /> PDF Document
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator />
              
              <DropdownMenuItem disabled className="gap-2 cursor-not-allowed opacity-50 py-2.5">
                <Camera className="w-4 h-4" />
                Snapshot (Soon)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Logo & Divider */}
          <div className="flex items-center gap-3">
             <Link href="/dashboard" className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
               Orblin
             </Link>
             <div className="h-5 w-[1px] bg-gray-200"></div>
          </div>

          {/* Board Title (Editable) */}
          <button
            onClick={() => setIsEditBoardModalOpen(true)}
            className="group flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100/80 transition-all"
          >
            <div className="flex flex-col items-start">
              <h1 className="text-sm font-semibold text-gray-800 leading-tight">
                {boardInfo.title}
              </h1>
              {boardInfo.category && (
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">
                  {boardInfo.category}
                </span>
              )}
            </div>
            <Edit3 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>

        {/* RIGHT SECTION: Actions & User */}
        <div className="flex items-center gap-2">
          
          {/* Quick Actions Group */}
          <div className="hidden md:flex items-center gap-1 pr-3 border-r border-gray-100">
            {onCopyCleanText && (
               <HeaderIconButton 
                 icon={Copy} 
                 onClick={onCopyCleanText} 
                 title="Copy all text" 
               />
            )}
            
            <HeaderIconButton 
              icon={Mic} 
              onClick={() => {}} 
              title="Voice (Coming Soon)"
              className="opacity-50 cursor-not-allowed" 
            />

            <Sheet>
              <SheetTrigger asChild>
                <button 
                  className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-purple-50 text-gray-500 hover:text-purple-600 transition-all duration-200"
                  title="AI Recommendations"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[400px] sm:w-[480px] bg-white/95 backdrop-blur-sm border-l border-gray-200 p-0">
                <SheetHeader className="sr-only"><SheetTitle>AI</SheetTitle></SheetHeader>
                <ResourceList 
                  boardTitle={boardInfo.title}
                  boardCategory={boardInfo.category}
                  onAddToBoard={onAddImageFromRecommendations}
                  onPlayVideo={onPlayVideo}
                  onOpenWebsite={onOpenWebsite} 
                />
              </SheetContent>
            </Sheet>

            <HeaderIconButton 
              icon={MessageSquare} 
              onClick={() => setIsChatOpen(true)} 
              title="Chat" 
            />
          </div>

          {/* Close Button (Temporary Board) */}
          {isTemporaryBoard && (
            <Button 
              onClick={handleCloseWithoutSave}
              variant="ghost"
              size="sm"
              className="h-9 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
            >
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          )}

          {/* Save Button (Primary) */}
          <Button 
            onClick={() => setShowSaveModal(true)}
            size="sm"
            className="h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm hover:shadow-md transition-all px-4 font-medium"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>

          {/* User Profile */}
          <Link href="/dashboard" className="ml-1">
            <Avatar className="h-9 w-9 rounded-xl border-2 border-white shadow-sm ring-1 ring-gray-100 hover:ring-blue-200 transition-all">
              <AvatarImage src={user?.imageUrl} alt={user?.fullName || ""} />
              <AvatarFallback className="rounded-xl bg-blue-50 text-blue-600 font-bold text-xs">
                {user?.fullName?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
          </Link>

        </div>
      </header>
      
      {/* Modals */}
      <SaveBoardModal 
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        tempBoardId={currentBoardId}
        boardElements={{
          reactShapes: boardElements?.reactShapes || [],
          konvaShapes: boardElements?.konvaShapes || [],
          stageFrames: boardElements?.stageFrames || [],
          images: boardElements?.images || [],
          connections: boardElements?.connections || [],
          stageState: { scale, position }
        }}
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

      <CreateBoard 
        open={isEditBoardModalOpen}
        onOpenChange={setIsEditBoardModalOpen}
        boardId={currentBoardId}
        initialData={{
          title: boardInfo.title,
          category: boardInfo.category
        }}
        onBoardUpdate={(updates) => {
          if (onBoardUpdate) onBoardUpdate(updates);
          setIsEditBoardModalOpen(false);
        }}
      />
    </>
  );
};

export default BoardHeader;