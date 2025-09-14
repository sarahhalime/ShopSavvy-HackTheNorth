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
          "Please share a bit about your situation or a financial question, and I’ll help you with clear next steps.",
        model: "none",
        fallback: true,
      })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        response:
          "I’m here for you. Try this: 1) List essentials. 2) Cap discretionary spend today. 3) Set one small goal (e.g., save $10). Share more and I’ll personalize the plan.",
        model: "fallback",
        fallback: true,
      })
    }

    const { GoogleGenerativeAI } = await import("@google/generative-ai")
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const system =
      "You are a concise, empathetic financial guide for consumers. Provide actionable, practical steps tailored to the user's situation. Keep responses under 180 words; use bullets when helpful."
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
