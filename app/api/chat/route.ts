import { NextRequest, NextResponse } from "next/server";

// Define proper TypeScript interfaces
interface GroqResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

export async function POST(request: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    console.error("GROQ_API_KEY is missing in .env.local");
    return NextResponse.json({ error: "Server configuration error: API key missing" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const query: string | undefined = body.query;

    if (!query || typeof query !== "string" || query.trim() === "") {
      return NextResponse.json({ error: "Invalid or empty query" }, { status: 400 });
    }

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: `Answer concisely in well-formatted markdown (use ## for headers, * for bullet points, ** for bold). Example: ## Response\n* **Item**: Description.\n${query.trim()}`,
          },
        ],
        
        temperature: 0.7,
        response_format: { type: "text" },
      }),
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error(`Groq API error: ${groqResponse.status} ${groqResponse.statusText} - ${errorText}`);
      throw new Error(`Groq API error: ${groqResponse.status}`);
    }

    // FIX 1: Replace 'any' with proper interface
    const data: GroqResponse = await groqResponse.json();
    const aiResponse: string = data.choices?.[0]?.message?.content?.trim() || "Sorry, something went wrong with the AI response.";

    return NextResponse.json({ response: aiResponse });
  } catch (error: unknown) { // FIX 2: Replace 'any' with 'unknown'
    console.error("Unexpected error in /api/chat:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Failed to connect to AI service" }, { status: 500 });
  }
}