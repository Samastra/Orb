"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  X, Send, Sparkles, User, Copy, RefreshCw, 
  Bot, AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface FloatingChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// Export this interface so we can use it in types if needed, or keep local
export interface Message {
  role: "user" | "ai" | "error"; // 'ai' maps to 'model' for Gemini
  content: string;
}

const FloatingChatPanel: React.FC<FloatingChatPanelProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    // 1. Create the new user message
    const userMessage: Message = { role: "user", content: input };
    
    // 2. Optimistically add to UI
    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // 3. CRITICAL CHANGE: Send the ENTIRE history, not just the query
        body: JSON.stringify({ messages: newHistory }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Unknown error");
      }
      
      const aiMessage: Message = { 
        role: "ai", 
        content: data.response || "I didn't get a response, please try again." 
      };
      setMessages((prev) => [...prev, aiMessage]);
      
    } catch (error: any) {
      const errorMessage: Message = { 
        role: "error", 
        content: error.message || "Could not connect to AI service." 
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

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
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* CHAT AREA */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/30 scroll-smooth">
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
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1", msg.role === "user" ? "bg-gray-900" : "bg-blue-100")}>
              {msg.role === "user" ? <User className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-blue-600" />}
            </div>
            <div className={cn("relative group max-w-[85%] text-sm px-4 py-3 rounded-2xl", msg.role === "user" ? "bg-gray-900 text-white rounded-tr-sm" : "bg-white border border-gray-200 text-gray-700 rounded-tl-sm shadow-sm")}>
              {msg.role === "error" ? (
                <div className="flex items-center gap-2 text-red-600"><AlertCircle className="w-4 h-4" /><span>{msg.content}</span></div>
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
              {msg.role === "ai" && (
                <button onClick={() => handleCopy(msg.content)} className="absolute -bottom-5 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600">
                  <Copy className="w-3 h-3" /> Copy
                </button>
              )}
            </div>
          </motion.div>
        ))}

        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0"><Sparkles className="w-4 h-4 text-blue-600" /></div>
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
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Ask Orb..."
            className="border-none bg-transparent focus-visible:ring-0 shadow-none px-3 text-sm h-10 resize-none"
            autoComplete="off"
          />
          <Button onClick={handleSend} disabled={!input.trim() || isLoading} size="icon" className={cn("h-9 w-9 rounded-lg shrink-0 transition-all", input.trim() ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md" : "bg-gray-200 text-gray-400")}>
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default FloatingChatPanel;