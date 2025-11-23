// app/api/chat/route.ts - MAIN CHAT ENDPOINT
import { NextRequest, NextResponse } from "next/server";

// Define proper TypeScript interfaces for DeepSeek
interface DeepSeekResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  usage?: {
    total_tokens: number;
  };
}

export async function POST(request: NextRequest) {
  if (!process.env.DEEPSEEK_API_KEY) {
    console.error("DEEPSEEK_API_KEY is missing in .env.local");
    return NextResponse.json({ 
      error: "Server configuration error: DeepSeek API key missing" 
    }, { status: 500 });
  }

  try {
    const body = await request.json();
    const query: string | undefined = body.query;

    if (!query || typeof query !== "string" || query.trim() === "") {
      return NextResponse.json({ error: "Invalid or empty query" }, { status: 400 });
    }

    const deepseekResponse = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "user",
            content: `Answer concisely in well-formatted markdown (use ## for headers, * for bullet points, ** for bold). Example: ## Response\n* **Item**: Description.\n${query.trim()}`,
          },
        ],
        temperature: 0.7,
        stream: false,
        max_tokens: 2048,
      }),
    });

    if (!deepseekResponse.ok) {
      const errorText = await deepseekResponse.text();
      console.error(`DeepSeek API error: ${deepseekResponse.status} ${deepseekResponse.statusText} - ${errorText}`);
      
      if (deepseekResponse.status === 401) {
        throw new Error("Invalid DeepSeek API key");
      } else if (deepseekResponse.status === 429) {
        throw new Error("Rate limit exceeded - try again later");
      } else {
        throw new Error(`DeepSeek API error: ${deepseekResponse.status}`);
      }
    }

    const data: DeepSeekResponse = await deepseekResponse.json();
    
    const aiResponse: string = data.choices?.[0]?.message?.content?.trim() 
      || "Sorry, I couldn't generate a response. Please try again.";

    return NextResponse.json({ 
      response: aiResponse,
      tokens: data.usage?.total_tokens
    });
    
  } catch (error: unknown) {
    console.error("Unexpected error in /api/chat:", error instanceof Error ? error.message : error);
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to connect to AI service" 
    }, { status: 500 });
  }
}