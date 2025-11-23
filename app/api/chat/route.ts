// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
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

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json",           // ← important!
      },
      body: JSON.stringify({
        model: "deepseek-coder",                 // ← this one works 100%
        messages: [
          {
            role: "user",
            content: `Answer concisely in clean markdown.\n\n${query.trim()}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2048,
        stream: false,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("DeepSeek error:", response.status, text);

      if (response.status === 401) return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
      if (response.status === 429) return NextResponse.json({ error: "Rate limited" }, { status: 429 });
      return NextResponse.json({ error: "AI service error" }, { status: 502 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || "No response";

    return NextResponse.json({
      response: content,
      tokens: data.usage?.total_tokens,
    });
  } catch (error) {
    console.error("Chat API crash:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}