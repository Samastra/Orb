// hooks/useOrbChat.ts
import { useState, useCallback } from "react";

export interface Message {
  role: "user" | "ai" | "error";
  content: string;
}

export const useOrbChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = useCallback(async () => {
    if (!input.trim()) return;

    // 1. Optimistic Update
    const userMessage: Message = { role: "user", content: input };
    const newHistory = [...messages, userMessage];
    
    setMessages(newHistory);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newHistory }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Unknown error");

      const aiMessage: Message = { 
        role: "ai", 
        content: data.response 
      };
      
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev, 
        { role: "error", content: error.message || "Connection failed." }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, messages]);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    input,
    setInput,
    isLoading,
    handleSend,
    clearChat
  };
};