"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import ResourceList from "@/components/ResourceList";
import SaveBoardModal from "@/components/save-modal-board";
import FloatingChatPanel from "@/components/FloatingChatPanel"; // CHANGED: New Import
import ShareBoardModal from "@/components/enterprise/sharing/ShareBoardModal";
import CreateBoard from "@/components/createBoard"; 
import { useUser } from "@clerk/nextjs";
import { 
  MessageSquare, Save, X, MoreVertical, Download, Share2, 
  FileImage, FileText, Image as ImageIcon, Edit3, Copy, Sparkles, Search
} from "lucide-react";
import type { ReactShape, ImageShape, Connection } from "@/types/board-types";
import type { KonvaShape } from "@/hooks/useShapes";
import { downloadAsImage, downloadAsPDF } from "@/lib/download-utils";
import { cn } from "@/lib/utils";
import type Konva from "konva";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSub, 
  DropdownMenuSubTrigger, DropdownMenuSubContent
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";

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
}) => {
  const { user } = useUser();
  
  // CHANGED: We now use isChatOpen to toggle the FloatingPanel, not a modal
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isEditBoardModalOpen, setIsEditBoardModalOpen] = useState(false); 
  
  // AI / Scanning State (For the Context Engine/ResourceList)
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [hasResults, setHasResults] = useState(false);

  // Trigger "Scan" on mount or title change
  useEffect(() => {
    if (boardInfo.title && boardInfo.title !== "Untitled Board") {
      setIsScanning(true);
      setHasResults(false);
      
      // Simulate AI processing time
      const timer = setTimeout(() => {
        setIsScanning(false);
        setHasResults(true); // Show notification dot
      }, 2500);
      
      return () => clearTimeout(timer);
    }
  }, [boardInfo.title]);

  const handleDownload = async (format: 'png' | 'jpeg' | 'pdf'): Promise<void> => {
    try {
      const stage = stageRef?.current;
      if (!stage) return;
      switch (format) {
        case 'png': downloadAsImage(stage, 'png'); break;
        case 'jpeg': downloadAsImage(stage, 'jpeg'); break;
        case 'pdf': downloadAsPDF(stage); break;
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const HeaderIconButton = ({ icon: Icon, onClick, className, title, active, badge }: any) => (
    <button 
      onClick={onClick}
      className={cn(
        "relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200",
        active 
          ? "bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100" 
          : "hover:bg-gray-100 text-gray-500 hover:text-gray-900",
        className
      )}
      title={title}
    >
      <Icon className="w-4 h-4" />
      {badge && (
        <span className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full border-2 border-white translate-x-1/2 -translate-y-1/2" />
      )}
    </button>
  );

  return (
    <>
      {/* 1. THE FLOATING SCANNER TOAST */}
      <AnimatePresence>
        {isScanning && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-20 left-1/2 z-50 flex items-center gap-3 bg-white pl-3 pr-4 py-2 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100"
          >
            <div className="relative flex items-center justify-center w-5 h-5">
              <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75" />
              <Search className="w-3 h-3 text-blue-600 relative z-10" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-gray-900">Scanning board context...</span>
              {/* Animated Progress Bar */}
              <div className="h-1 w-32 bg-gray-100 rounded-full mt-1 overflow-hidden">
                <motion.div 
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="h-full w-full bg-gradient-to-r from-blue-400 to-purple-400"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. THE HEADER */}
      <header className="fixed top-4 left-4 right-4 z-40 flex items-center justify-between bg-white/95 backdrop-blur-xl px-4 py-2 rounded-2xl shadow-sm border border-gray-200/50">
        
        {/* Left: Title & Menu */}
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 rounded-xl shadow-xl">
              <DropdownMenuItem onClick={() => setIsShareModalOpen(true)} className="gap-2 py-2.5">
                <Share2 className="w-4 h-4" /> Share Board
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="gap-2 py-2.5">
                  <Download className="w-4 h-4" /> Download
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="rounded-xl shadow-xl">
                  <DropdownMenuItem onClick={() => handleDownload('png')} className="gap-2"><FileImage className="w-4 h-4" /> PNG</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownload('jpeg')} className="gap-2"><ImageIcon className="w-4 h-4" /> JPEG</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownload('pdf')} className="gap-2"><FileText className="w-4 h-4" /> PDF</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="h-5 w-[1px] bg-gray-200"></div>

          <button onClick={() => setIsEditBoardModalOpen(true)} className="group flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-50 transition-all text-left">
            <div>
              <h1 className="text-sm font-bold text-gray-900 leading-tight">{boardInfo.title}</h1>
              {boardInfo.category && <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{boardInfo.category}</span>}
            </div>
            <Edit3 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          
          <div className="hidden md:flex items-center gap-1 pr-3 border-r border-gray-100 relative">
            {onCopyCleanText && (
               <HeaderIconButton icon={Copy} onClick={onCopyCleanText} title="Copy text" />
            )}
            
            {/* THE CONTEXT ENGINE TOGGLE */}
            <HeaderIconButton 
              icon={Sparkles} 
              active={isAIPanelOpen}
              badge={hasResults && !isAIPanelOpen}
              onClick={() => {
                setIsAIPanelOpen(!isAIPanelOpen);
                if (isChatOpen) setIsChatOpen(false); // Close Chat if open
                setHasResults(false);
              }} 
              title="Context Engine"
              className={isAIPanelOpen ? "text-blue-600 bg-blue-50" : "text-gray-500 hover:text-blue-600"}
            />

            {/* THE NEW CHAT TOGGLE */}
            <HeaderIconButton 
              icon={MessageSquare} 
              active={isChatOpen}
              onClick={() => {
                setIsChatOpen(!isChatOpen);
                if (isAIPanelOpen) setIsAIPanelOpen(false); // Close Context Engine if open
              }} 
              title="Chat Assistant" 
              className={isChatOpen ? "text-blue-600 bg-blue-50" : "text-gray-500 hover:text-blue-600"}
            />
          </div>

          {isTemporaryBoard && (
            <Button onClick={handleCloseWithoutSave} variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 rounded-xl">
              Close
            </Button>
          )}

          <Button onClick={() => setShowSaveModal(true)} size="sm" className="bg-gray-900 hover:bg-black text-white rounded-xl shadow-sm px-4">
            <Save className="w-4 h-4 mr-2" /> Save
          </Button>

          <Link href="/dashboard" className="ml-1">
            <Avatar className="h-9 w-9 rounded-xl border border-gray-200">
              <AvatarImage src={user?.imageUrl} />
              <AvatarFallback className="bg-gray-100 text-gray-600 text-xs font-bold">
                {user?.fullName?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </header>

      {/* 3. FLOATING PANELS */}
      <AnimatePresence>
        {/* Context Engine Panel (Resources) */}
        {isAIPanelOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-20 right-4 bottom-4 w-[400px] max-w-[calc(100vw-32px)] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col z-50 h-[calc(100vh-6rem)]"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-bold text-gray-900">Context Engine</span>
              </div>
              <button onClick={() => setIsAIPanelOpen(false)} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden h-full">
              <ResourceList 
                boardTitle={boardInfo.title}
                boardCategory={boardInfo.category}
                onAddToBoard={onAddImageFromRecommendations}
                onPlayVideo={onPlayVideo}
                onOpenWebsite={onOpenWebsite} 
              />
            </div>
          </motion.div>
        )}

        {/* New Floating Chat Panel */}
        {isChatOpen && (
          <FloatingChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        )}
      </AnimatePresence>
      
      {/* Modals */}
      <SaveBoardModal isOpen={showSaveModal} onClose={() => setShowSaveModal(false)} tempBoardId={currentBoardId} boardElements={boardElements || { reactShapes: [], konvaShapes: [], stageFrames: [], images: [], connections: [] }} />
      <ShareBoardModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} boardId={currentBoardId} boardTitle={boardInfo.title} />
      <CreateBoard open={isEditBoardModalOpen} onOpenChange={setIsEditBoardModalOpen} boardId={currentBoardId} initialData={boardInfo} onBoardUpdate={(u) => { onBoardUpdate?.(u); setIsEditBoardModalOpen(false); }} />
    </>
  );
};

export default BoardHeader;