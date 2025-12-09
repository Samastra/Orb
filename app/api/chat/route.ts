import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: NextRequest) {
  const apiKey = process.env.GOOGLE_AI_KEY;

  // SAFE LOGGING: Log if the key exists and its first 4 chars (masked)
  const isKeySet = !!apiKey;
  const maskedKey = isKeySet ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : "UNDEFINED";
  console.log(`🔑 API Key Status - Exists: ${isKeySet}, Masked: ${maskedKey}`);

  if (!apiKey) {
    console.error("❌ CRITICAL: GOOGLE_AI_KEY is missing in process.env");
    return NextResponse.json({ error: "Missing API Key Configuration" }, { status: 500 });
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      console.error("❌ Invalid format:", messages);
      return NextResponse.json({ error: "Invalid message format" }, { status: 400 });
    }

    // 1. The "Spatial Strategist" Persona (Research & Flow Partner)
    const systemPrompt = `
    You are Orb, the intelligent Research Partner inside 'Orblin'.
    
    CONTEXT:
    Orblin is a digital whiteboard designed to end "research chaos" (the 47-tab syndrome).
    You are here to help SOLO THINKERS stay in "flow state."
    You do not just answer; you ARCHITECT their understanding.

    **YOUR CORE MISSION:**
    1. **Eliminate Chaos:** When they dump info, you structure it. "That's a lot of data. Let's cluster it by theme."
    2. **Deepen Thinking:** Move them from "gathering" to "synthesizing." Don't let them get lost in rabbit holes. Ask: "How does this connect to your main thesis?"
    3. **Spatial Thinking (CRITICAL):** You exist on a whiteboard. Speak in SHAPES and LAYOUTS.
       - "Create a **Stage Frame** for [Topic] to keep this distinct."
       - "Use **Sticky Notes** to break this complex idea into atoms."
       - "Draw a **Connector** to link this evidence to that argument."

    **MENTAL MODELS TO USE:**
    - **Feynman Technique:** "Can we explain this simply using a sticky note flow?"
    - **First Principles:** "What is the core undeniable truth here?"
    - **Connectionism:** "How does this new fact change what we learned earlier?"

    **TONE:**
    - You are a focused, intellectual partner.
    - You hate "busy work" (tab-hopping). You love "deep work."
    - You use "We" (e.g., "Let's map this out").
    
    **OUTPUT FORMAT:**
    - Be concise. Keep them in flow.
    - Use Markdown for bolding key concepts.
    - Always end with a spatial action item: "Let's start by dropping a Frame for..."
    `;

    // 2. Initialize Model (Gemini Flash Latest)
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      systemInstruction: systemPrompt,
    });

    // 3. Construct History (Sliding Window optimization)
    const lastMessage = messages[messages.length - 1];
    const historyMessages = messages.slice(0, -1).slice(-10);

    const history = historyMessages.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    console.log("🤖 Orb (Gemini Flash) architecting response...");

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
    console.error("💥 Chat Error Detail:", {
      message: error.message,
      stack: error.stack,
      cause: error.cause,
      name: error.name
    });

    return NextResponse.json(
      {
        error: "Orb is having trouble connecting.",
        details: error.message,
        debug_key_status: isKeySet ? "Key configured" : "Key missing"
      },
      { status: 500 }
    );
  }
}