"use client";

import React, { useState, useRef, useEffect } from 'react';
import { X, Move, ExternalLink, RefreshCw, Copy, Check } from 'lucide-react';

interface WebsitePlayerModalProps {
  url: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

const WebsitePlayerModal: React.FC<WebsitePlayerModalProps> = ({
  url,
  title,
  isOpen,
  onClose,
}) => {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Mobile-sized dimensions
  const modalWidth = 360;
  const modalHeight = 640;

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.no-drag')) return;
    
    setIsDragging(true);
    const rect = modalRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
    e.preventDefault();
  };

  // Handle drag movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // Keep within viewport bounds
      const maxX = window.innerWidth - modalWidth;
      const maxY = window.innerHeight - modalHeight;

      setPosition({
        x: Math.max(10, Math.min(newX, maxX)),
        y: Math.max(10, Math.min(newY, maxY))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset, modalWidth, modalHeight]);

  // Function to convert copied HTML to plain text
  const handleCopyAsPlainText = async () => {
    try {
      // Read whatever is in the clipboard
      const clipboardItems = await navigator.clipboard.read();
      
      for (const item of clipboardItems) {
        // Try to get plain text first
        if (item.types.includes('text/plain')) {
          const plainTextBlob = await item.getType('text/plain');
          const plainText = await plainTextBlob.text();
          
          // Write back as plain text only
          await navigator.clipboard.writeText(plainText);
          showCopyFeedback();
          return;
        }
        
        // If only HTML is available, convert it
        if (item.types.includes('text/html')) {
          const htmlBlob = await item.getType('text/html');
          const html = await htmlBlob.text();
          
          // Strip HTML tags to get plain text
          const plainText = html.replace(/<[^>]*>/g, '').trim();
          
          // Write back as plain text
          await navigator.clipboard.writeText(plainText);
          showCopyFeedback();
          return;
        }
      }
      
      // Fallback: try to read as text directly
      const text = await navigator.clipboard.readText();
      if (text) {
        // Clean any HTML that might be in there
        const cleanText = text.replace(/<[^>]*>/g, '').trim();
        await navigator.clipboard.writeText(cleanText);
        showCopyFeedback();
      }
    } catch (error) {
      console.log('Copy helper failed, trying fallback method');
      
      // Fallback method for browsers that don't support clipboard API
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          const cleanText = text.replace(/<[^>]*>/g, '').trim();
          await navigator.clipboard.writeText(cleanText);
          showCopyFeedback();
        }
      } catch (fallbackError) {
        console.log('Fallback copy method also failed');
        // Show error feedback
        setShowCopySuccess(true);
        setTimeout(() => setShowCopySuccess(false), 2000);
      }
    }
  };

  const showCopyFeedback = () => {
    setShowCopySuccess(true);
    setTimeout(() => setShowCopySuccess(false), 2000);
  };

  // Handle iframe load
  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  // Handle iframe error
  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Refresh iframe
  const handleRefresh = () => {
    if (iframeRef.current) {
      setIsLoading(true);
      setHasError(false);
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  // Open in new tab
  const handleOpenInNewTab = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Reset loading state when URL changes
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setHasError(false);
    }
  }, [url, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Copy Success Toast */}
      {showCopySuccess && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-60 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 pointer-events-auto">
          <Check className="w-4 h-4" />
          <span className="text-sm font-medium">Text converted to plain text!</span>
        </div>
      )}

      {/* Draggable Modal */}
      <div
        ref={modalRef}
        className={`
          absolute bg-white rounded-2xl shadow-2xl border border-gray-300 
          overflow-hidden transition-all duration-200 pointer-events-auto
          ${isDragging ? 'cursor-grabbing scale-105 shadow-2xl' : 'cursor-grab'}
        `}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${modalWidth}px`,
          height: `${modalHeight}px`,
        }}
      >
        {/* Header - Drag Handle */}
        <div
          className="flex items-center justify-between p-3 border-b border-gray-200 bg-white cursor-move"
          onMouseDown={handleDragStart}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Move className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-700 truncate">
              {title}
            </span>
          </div>
          
          <div className="flex items-center gap-1 no-drag">
            {/* Copy as Plain Text Button */}
            <button
              onClick={handleCopyAsPlainText}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors duration-200 group relative"
              title="Convert copied text to plain text"
            >
              <Copy className="w-3 h-3 text-gray-600" />
              {/* Tooltip */}
              <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                Copy as Plain Text
              </div>
            </button>

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              title="Refresh"
            >
              <RefreshCw className="w-3 h-3 text-gray-600" />
            </button>

            {/* Open in new tab */}
            <button
              onClick={handleOpenInNewTab}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              title="Open in new tab"
            >
              <ExternalLink className="w-3 h-3 text-gray-600" />
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

        {/* Instructions */}
        <div className="bg-blue-50 border-b border-blue-200 px-3 py-2">
          <p className="text-xs text-blue-700 text-center">
            <strong>Tip:</strong> Copy text normally, then click the <Copy className="w-3 h-3 inline mx-1" /> button to convert to plain text
          </p>
        </div>

        {/* Website Content */}
        <div className="w-full h-[calc(100%-84px)] bg-gray-100 relative">
          {/* Loading State */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
                <p className="text-sm text-gray-500">Loading website...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <div className="flex flex-col items-center gap-2 text-center p-4">
                <X className="w-8 h-8 text-red-400" />
                <p className="text-sm text-gray-700">Failed to load website</p>
                <button
                  onClick={handleRefresh}
                  className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors mt-2"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Iframe */}
          <iframe
            ref={iframeRef}
            src={url}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={title}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        </div>
      </div>
    </div>
  );
};

export default WebsitePlayerModal;