"use client";

import React, { useState, useRef, useEffect } from 'react';
import { X, Minimize2, Maximize2, Move } from 'lucide-react';

interface VideoPlayerModalProps {
  videoId: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  videoId,
  title,
  isOpen,
  onClose,
}) => {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.video-controls')) return;
    
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    e.preventDefault();
  };

  // Handle drag movement
  const handleDrag = (e: MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    // Keep within viewport bounds
    const maxX = window.innerWidth - 400;
    const maxY = window.innerHeight - 300;

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  // Handle drag end
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('mouseup', handleDragEnd);
      return () => {
        document.removeEventListener('mousemove', handleDrag);
        document.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, dragOffset]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
return (
  <div className="fixed inset-0 z-50 pointer-events-none">
    {/* NO BACKDROP - modal floats freely */}
    
    {/* Draggable Modal */}
    <div
      ref={modalRef}
      className={`
        absolute bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/80 
        overflow-hidden transition-all duration-300 pointer-events-auto
        ${isMinimized ? 'w-80 h-20' : 'w-[400px] h-[300px]'}
        ${isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab'}
      `}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
        {/* Header - Drag Handle */}
        <div
          className="flex items-center justify-between p-3 border-b border-gray-200/80 bg-gradient-to-r from-gray-50 to-white/80 cursor-move"
          onMouseDown={handleDragStart}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Move className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-700 truncate">
              {title}
            </span>
          </div>
          
          <div className="flex items-center gap-1 video-controls">
            {/* Minimize/Maximize */}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 rounded-lg hover:bg-gray-200/80 transition-colors duration-200"
            >
              {isMinimized ? (
                <Maximize2 className="w-3 h-3 text-gray-600" />
              ) : (
                <Minimize2 className="w-3 h-3 text-gray-600" />
              )}
            </button>
            
            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-red-100 transition-colors duration-200"
            >
              <X className="w-3 h-3 text-gray-600 hover:text-red-600" />
            </button>
          </div>
        </div>

        {/* Video Content */}
        {!isMinimized && (
          <div className="w-full h-[calc(100%-52px)] bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={title}
            />
          </div>
        )}

        {/* Minimized State */}
        {isMinimized && (
          <div className="p-3 h-full flex items-center justify-between">
            <span className="text-sm text-gray-600 truncate flex-1">
              {title}
            </span>
            <button
              onClick={() => setIsMinimized(false)}
              className="px-2 py-1 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Restore
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayerModal;