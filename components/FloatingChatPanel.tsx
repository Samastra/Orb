"use client";

import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  X, Send, Sparkles, User, Copy, RefreshCw, 
  Bot, AlertCircle, Trash2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { Message } from "@/hooks/useOrbChat";

interface FloatingChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  // State from Parent (useOrbChat)
  messages: Message[];
  input: string;
  setInput: (val: string) => void;
  isLoading: boolean;
  onSend: () => void;
  onClear: () => void;
  // The "Magic Render" Handler
  onAddToBoard?: (text: string) => void;
}

const FloatingChatPanel: React.FC<FloatingChatPanelProps> = ({ 
  isOpen, 
  onClose, 
  messages, 
  input, 
  setInput, 
  isLoading, 
  onSend, 
  onClear,
  onAddToBoard 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll whenever messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="fixed top-20 right-4 bottom-4 w-[400px] max-w-[calc(100vw-32px)] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col z-50 h-[calc(100vh-6rem)]"
    >
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Orb Assistant</h3>
            <p className="text-[10px] text-gray-500 font-medium">Your Creative Partner</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button 
            onClick={onClear} 
            className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full text-gray-400 transition-colors" 
            title="Clear Chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CHAT AREA */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/30 scroll-smooth"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-60">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Bot className="w-6 h-6 text-gray-400" />
            </div>
            <h4 className="text-sm font-semibold text-gray-700">Hey Partner!</h4>
            <p className="text-xs text-gray-500 mt-1 max-w-[200px]">
              I'm here to brainstorm, critique, and help you build. What are we working on?
            </p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
          >
            {/* Avatar */}
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1", 
              msg.role === "user" ? "bg-gray-900" : "bg-blue-100"
            )}>
              {msg.role === "user" ? <User className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-blue-600" />}
            </div>

            {/* Bubble */}
            <div className={cn(
              "relative group max-w-[85%] text-sm px-4 py-3 rounded-2xl", 
              msg.role === "user" 
                ? "bg-gray-900 text-white rounded-tr-sm" 
                : "bg-white border border-gray-200 text-gray-700 rounded-tl-sm shadow-sm"
            )}>
              {msg.role === "error" ? (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>{msg.content}</span>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown components={{
                      p: ({children}) => <p className="mb-1 last:mb-0 leading-relaxed">{children}</p>,
                      ul: ({children}) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                      ol: ({children}) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                      code: ({children}) => <code className="bg-black/10 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                    }}>{msg.content}</ReactMarkdown>
                </div>
              )}

              {/* Action Buttons (AI Only) */}
              {msg.role === "ai" && (
                <div className="flex gap-2 absolute -bottom-6 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleCopy(msg.content)}
                    className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 bg-white/50 px-2 py-1 rounded-full border border-gray-100 backdrop-blur-sm"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                  
                  {/* ✨ THE MAGIC BUTTON ✨ */}
                  {onAddToBoard && (
                    <button
                      onClick={() => onAddToBoard(msg.content)}
                      className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-full border border-blue-100 backdrop-blur-sm font-medium transition-all hover:shadow-sm"
                    >
                      <Sparkles className="w-3 h-3" /> Add to Board
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-blue-600" />
            </div>
            <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
            </div>
          </motion.div>
        )}
      </div>

      {/* INPUT AREA */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl px-2 py-2 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all shadow-inner">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onSend()}
            placeholder="Ask Orb..."
            className="border-none bg-transparent focus-visible:ring-0 shadow-none px-3 text-sm h-10 resize-none"
            autoComplete="off"
          />
          <Button 
            onClick={onSend} 
            disabled={!input.trim() || isLoading} 
            size="icon" 
            className={cn(
              "h-9 w-9 rounded-lg shrink-0 transition-all", 
              input.trim() ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md" : "bg-gray-200 text-gray-400"
            )}
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
          </Button>
        </div>
        <div className="text-center mt-2">
           <p className="text-[10px] text-gray-400">AI can make mistakes. Check important info.</p>
        </div>
      </div>
    </motion.div>
  );
};

export default FloatingChatPanel;