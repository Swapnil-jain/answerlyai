import { NextResponse } from 'next/server'
import Groq from "groq-sdk"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

export async function POST(request: Request) {
  try {
    const { message, context, history } = await request.json()

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: context },
        ...history,
        { role: "user", content: message }
      ],
      model: "mixtral-8x7b-32768", // or "llama2-70b-4096"
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      stream: false
    })

    return NextResponse.json({
      success: true,
      response: chatCompletion.choices[0]?.message?.content || "No response generated"
    })
  } catch (error) {
    console.error('Chat API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to process chat request'
      },
      { status: 500 }
    )
  }
} 