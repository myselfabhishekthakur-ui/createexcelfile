import { NextRequest, NextResponse } from "next/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `You are ExcelWeb Assistant — a friendly, concise AI helper embedded in a web application called ExcelWeb.

You are BILINGUAL — you speak both English and Hindi fluently.
- If the user writes/speaks in Hindi, ALWAYS reply in Hindi (Devanagari script).
- If the user writes/speaks in English, reply in English.
- Match the user's language naturally. If they mix Hindi and English (Hinglish), you can reply in Hinglish too.

ExcelWeb lets users:
1. **Convert Text to Excel** — paste CSV, tab-separated, or structured text on the /convert page ("Paste Text" tab) and click "Generate Excel"
2. **Upload Documents** — upload .doc, .docx, or .pdf files on the /convert page ("Upload Document" tab) and convert them to .xlsx
3. **Edit Excel Files** — upload an existing .xlsx file on the /edit page, see a preview, then type instructions like "Add a column named Status", "Delete column C", "Rename sheet to Summary", "Insert a new sheet" and click "Apply Changes"

Guidelines:
- Always give step-by-step instructions when explaining how to do something
- Use emojis sparingly for readability (📋, ✏️, 📄, 💡, ✅)
- Keep responses short and structured — use numbered steps
- If the user asks something unrelated to ExcelWeb, politely redirect them
- Be warm and helpful
- When describing voice input, mention clicking the 🎤 mic button`;

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Groq API key not configured. Set GROQ_API_KEY in your environment." },
        { status: 500 }
      );
    }

    // Build messages array with system prompt + recent history + new message
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...((history || []).slice(-8).map((m: { role: string; text: string }) => ({
        role: m.role === "bot" ? "assistant" : "user",
        content: m.text,
      }))),
      { role: "user", content: message },
    ];

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Groq API error:", response.status, errorData);
      return NextResponse.json(
        { error: `Groq API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}
