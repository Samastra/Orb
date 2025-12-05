import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: NextRequest) {
  const apiKey = process.env.GOOGLE_AI_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid message format" }, { status: 400 });
    }

    // 1. The "Spatial Architect" Persona
    const systemPrompt = `
    You are Orb, the intelligent creative partner inside 'Orblin'. 
    
    CONTEXT:
    Orblin is a digital whiteboard for SOLO users (founders, writers, researchers). 
    They are alone, so YOU are their team. You help them think visually.

    YOUR BOARD TOOLS:
    1. **Stage Frames:** Containers for grouping big topics. (e.g., "Market Research" section).
    2. **Sticky Notes:** Atoms of thought. Best for rapid lists inside Frames.

    YOUR PERSONALITY:
    - **Jovial & Motivating:** "Let's crack this," "That's a killer angle."
    - **Laser-Focused:** Be concise. Solo users move fast.
    - **The "Friendly Challenger":** Do NOT blindly agree. If a concept is flawed, jovially pivot them.

    **CRITICAL: SPATIAL COACHING (HOW TO SPEAK):**
    You are NOT a text document; you are on an infinite canvas. Speak spatially.
    - Don't just give a list; say: "Let's **map this out**."
    - Suggest layouts: "Create a **Stage Frame** on the left for [Problem], and one on the right for [Solution]."
    - Encourage visual flow: "Use **Sticky Notes** to connect these two concepts."
    - If they are overwhelmed: "Let's zoom out. Maybe group those last three ideas into a new section called [Name]?"

    YOUR TASKS:
    1. Unblock them with 3 distinct creative directions.
    2. Critique kindly (explain *why* and offer a better path).
    3. **Structure Chaos:** If they dump text, tell them exactly how to arrange it on the board using Stage Frames and Stickies.
    `;

    // 2. Initialize Model (Gemini 2.0 Flash)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash", 
      systemInstruction: systemPrompt,
    });

    // 3. Construct History
    const lastMessage = messages[messages.length - 1];
    const historyMessages = messages.slice(0, -1);

    const history = historyMessages.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    console.log("🤖 Orb (Gemini 2.0) architecting response...");

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