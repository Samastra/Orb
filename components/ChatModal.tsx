import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Copy, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: "user" | "ai" | "error";
  content: string;
}

const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage: Message = { role: "user", content: input };
    setMessages([...messages, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: input }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle API errors (401, 429, 500, etc.)
        const errorMessage: Message = { 
          role: "error", 
          content: `Error ${response.status}: ${data.error || "Unknown error"}` 
        };
        setMessages([...messages, userMessage, errorMessage]);
        return;
      }
      
      const aiMessage: Message = { 
        role: "ai", 
        content: data.response || "Sorry, I couldn't generate a response." 
      };
      setMessages([...messages, userMessage, aiMessage]);
      
    } catch (error) {
      console.error("Network error:", error);
      const errorMessage: Message = { 
        role: "error", 
        content: "Network error: Could not connect to AI service. Check your internet connection." 
      };
      setMessages([...messages, userMessage, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    console.log("Copied to clipboard:", content);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px] bg-white/95 backdrop-blur-sm border-gray-200/80">
        <DialogHeader>
          <DialogTitle className="text-gray-700 font-medium">Ask Orb</DialogTitle>
        </DialogHeader>
        <div className="max-h-[400px] overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="text-gray-500 text-sm text-center">
              Ask Orb anything, like &ldquo;Best roadmap to study Python in 3 months&rdquo;!
            </div>
          )}
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} mb-4`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : msg.role === "error"
                    ? "bg-red-100 text-red-700 border border-red-300"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {msg.role === "error" && (
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-medium">Error</span>
                  </div>
                )}
                {msg.role === "user" ? (
                  msg.content
                ) : (
                  <ReactMarkdown
                    components={{
                      h2: ({ children }) => <h2 className="text-lg font-bold text-gray-800 mt-2 mb-1">{children}</h2>,
                      ul: ({ children }) => <ul className="list-disc pl-5 mb-2">{children}</ul>,
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                )}
                {msg.role === "ai" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 p-1"
                    onClick={() => handleCopy(msg.content)}
                    title="Copy to clipboard"
                  >
                    <Copy className="w-4 h-4 text-gray-600" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-center">
              <div className="text-gray-500 text-sm">Orb is thinking...</div>
            </div>
          )}
        </div>
        <DialogFooter className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 border-gray-300 focus:border-blue-500"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChatModal;