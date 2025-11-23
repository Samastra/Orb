// app/api/chat/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.error("❌ DeepSeek API key missing");
    return NextResponse.json(
      { error: "Missing DeepSeek API key" },
      { status: 500 }
    );
  }

  try {
    const { query } = await request.json();

    if (!query || typeof query !== "string" || query.trim() === "") {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    console.log("🤖 Sending to DeepSeek:", query.substring(0, 100));

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat", // ← Use the main chat model
        messages: [
          {
            role: "user",
            content: query.trim(),
          },
        ],
        temperature: 0.7,
        max_tokens: 1024, // Reduced for faster response
        stream: false,
      }),
    });

    console.log("📡 DeepSeek response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ DeepSeek API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });

      if (response.status === 401) {
        return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
      }
      if (response.status === 429) {
        return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
      }
      return NextResponse.json({ 
        error: `AI service error: ${response.status}` 
      }, { status: 502 });
    }

    const data = await response.json();
    console.log("✅ DeepSeek success, tokens:", data.usage?.total_tokens);

    const content = data.choices?.[0]?.message?.content?.trim() 
      || "Sorry, I couldn't generate a response.";

    return NextResponse.json({
      response: content,
      tokens: data.usage?.total_tokens,
    });

  } catch (error) {
    console.error("💥 Chat API crash:", error);
    return NextResponse.json(
      { error: "Failed to connect to AI service" },
      { status: 500 }
    );
  }
}