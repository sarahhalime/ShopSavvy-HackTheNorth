import { NextResponse } from "next/server"

type ReqBody = {
  content?: string
  mood?: string
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ReqBody
    const content = (body?.content || "").trim()
    const mood = body?.mood || "neutral"

    if (!content) {
      return NextResponse.json({
        response:
          "Hi! Tell me one thing you want help with — budgeting, saving, or spending habits?",
        model: "none",
        fallback: true,
      })
    }

    // Heuristic: if the user just greets or writes something very short, keep it super concise
    const textLC = content.toLowerCase().trim()
    const isGreeting = /^(hi|hello|hey|yo|hiya|sup|what's up|whats up)[!\.\s]*$/i.test(textLC)
    const isVeryShort = !isGreeting && textLC.split(/\s+/).filter(Boolean).length <= 3 && textLC.length <= 20
    if (isGreeting) {
      return NextResponse.json({
        response: "Hey! How can I help — budgeting, saving, or spending habits?",
        model: "none",
        fallback: true,
      })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      const fallbackShort = isVeryShort
        ? "Got it. What’s the goal — budget, saving, or cutting spend this week?"
        : "Quick win: note top 3 expenses, set a daily limit, and try the 50/30/20 split. Share income/goals for a tailored plan."
      return NextResponse.json({ response: fallbackShort, model: "fallback", fallback: true })
    }

    const { GoogleGenerativeAI } = await import("@google/generative-ai")
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const system =
      "You are a concise, empathetic financial guide for consumers. Provide actionable, practical steps tailored to the user's situation. Keep responses under 120 words. If the user's message is a greeting or very short, reply in ONE friendly sentence plus ONE short follow-up question; do not use lists or long paragraphs in that case."
    const prompt = `Mood: ${mood}.\nUser: ${content}\nAdvisor:`

    const result = await model.generateContent([system, prompt])
    const text = result?.response?.text?.() || "I can help with budgeting, spending insights, and saving tips. Could you add a bit more detail?"

    return NextResponse.json({ response: text, model: "gemini-1.5-flash", fallback: false })
  } catch (e: any) {
    return NextResponse.json(
      {
        response:
          "Thanks for sharing. Quick steps: 1) Note top 3 expenses this week. 2) Set a daily spend limit. 3) Try the 50/30/20 rule as a baseline. Share income/goals for a tailored plan.",
        model: "fallback",
        fallback: true,
        error: e?.message || String(e),
      },
      { status: 200 }
    )
  }
}
