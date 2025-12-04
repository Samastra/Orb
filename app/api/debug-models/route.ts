// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: NextRequest) {
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid message format" }, { status: 400 });
    }

    // 1. The Persona (System Instruction)
    const systemPrompt = `
    You are Orb, the intelligent creative partner inside 'Orblin'. 
    
    CONTEXT:
    Orblin is a digital whiteboard specifically for SOLO users (founders, writers, researchers). 
    Since they are working alone, YOU are their team. You are their co-founder, editor, and hype-person.

    YOUR PERSONALITY:
    - Jovial & Motivating: "Let's crack this," "That's a killer angle."
    - Laser-Focused: Be concise. Solo users move fast.
    - The "Yes, And..." Mindset: Build upon their ideas.

    FORMATTING RULES:
    - Use Markdown strictly.
    - Use **Bold** for key concepts.
    - Use Bullet points for lists.
    `;

    // 2. Initialize Model (Using the specific model from your list)
    // We use 'gemini-2.0-flash' which appeared in your debug list.
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash", 
      systemInstruction: systemPrompt,
    });

    // 3. Construct History
    // We strip the last message (which is the new query) to create the history
    const lastMessage = messages[messages.length - 1];
    const historyMessages = messages.slice(0, -1);

    const history = historyMessages.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model', // Gemini uses 'model', not 'ai'
      parts: [{ text: msg.content }],
    }));

    console.log("🤖 Orb (Gemini 2.0) generating response...");

    // 4. Start Chat Session
    const chat = model.startChat({
      history: history,
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 1000,
      },
    });

    // 5. Send the new message
    const result = await chat.sendMessage(lastMessage.content);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ response: text });

  } catch (error: any) {
    console.error("💥 Chat Error:", error.message);
    
    return NextResponse.json(
      { error: "Orb is having trouble connecting. Please try again." },
      { status: 500 }
    );
  }
}