import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Groq from 'groq-sdk'
import { generateSystemPrompt } from '@/lib/utils/chatPrompts';
import { RateLimiter } from '@/lib/utils/rateLimiter'
import { isAdmin } from '@/lib/utils/adminCheck'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    // Get the auth token from the request header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('Authorization header missing')
    }

    // Extract the token
    const token = authHeader.replace('Bearer ', '')
    
    // Verify the session with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      throw new Error('Authentication required')
    }

    // Ensure user.id exists
    if (!user.id) {
      throw new Error('User ID not found')
    }

    const { message, workflowId, history } = await req.json()

    // Estimate token count (rough estimation)
    const estimatedTokens = message.length / 4 + 
      history.reduce((acc: number, msg: any) => acc + msg.content.length / 4, 0)

    // Log the estimated token count
    console.log('Estimated token count:', estimatedTokens)

    console.log('Rate limit check for:', {
      userId: user.id,
      type: 'chatting',
      estimatedTokens: Math.ceil(estimatedTokens)
    })

    // Check rate limits
    const rateLimitCheck = await RateLimiter.checkRateLimit(
      user.id,
      'chatting',
      Math.ceil(estimatedTokens)
    )

    console.log('Rate limit response:', rateLimitCheck)

    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { success: false, message: rateLimitCheck.reason },
        { status: 429 }
      )
    }

    // Get workflow context from appropriate table
    const isAdminUser = isAdmin(user.id)
    const workflowTable = isAdminUser ? 'sample_workflows' : 'workflows'
    const faqTable = isAdminUser ? 'sample_faqs' : 'faqs'

    const { data: workflowData, error: workflowError } = await supabase
      .from(workflowTable)
      .select('context, nodes, edges')
      .eq('id', workflowId)
      .single()

    if (workflowError) throw workflowError

    // Get FAQs from appropriate table
    const { data: faqData, error: faqError } = await supabase
      .from(faqTable)
      .select('*')
      .eq('workflow_id', workflowId)

    if (faqError) throw faqError

    // Improved scenario and decision mapping
    const decisionFlows = workflowData.nodes
      ?.filter((node: any) => node.type === "start")
      .map((startNode: any) => {
        // Get all immediate decision nodes connected to start
        const connectedDecisions = workflowData.edges
          ?.filter((edge: any) => edge.source === startNode.id)
          .map((edge: any) => {
            const decisionNode = workflowData.nodes?.find(
              (node: any) => node.id === edge.target && node.type === "decision"
            )
            if (!decisionNode) return null

            // Get scenarios connected to this decision
            const scenarios = workflowData.edges
              ?.filter((e: any) => e.target === decisionNode.id)
              .map((e: any) => {
                const scenarioNode = workflowData.nodes?.find(
                  (n: any) => n.id === e.source && n.type === "scenario"
                )
                return scenarioNode?.data.label
              })
              .filter(Boolean)

            // Get actions based on yes/no paths
            const yesAction = workflowData.edges
              ?.find((e: any) => e.source === decisionNode.id && e.sourceHandle === "yes")
            const noAction = workflowData.edges
              ?.find((e: any) => e.source === decisionNode.id && e.sourceHandle === "no")

            const yesActionNode = workflowData.nodes?.find(
              (n: any) => n.id === yesAction?.target && n.type === "action"
            )
            const noActionNode = workflowData.nodes?.find(
              (n: any) => n.id === noAction?.target && n.type === "action"
            )

            return {
              decision: decisionNode.data.label,
              scenarios: scenarios,
              actions: {
                yes: yesActionNode?.data.label,
                no: noActionNode?.data.label
              }
            }
          })
          .filter(Boolean)

        return connectedDecisions
      })
      .flat()

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: generateSystemPrompt(workflowData.context, decisionFlows, faqData)
        },
        ...history,
        { role: 'user', content: message }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0,
      max_tokens: 1024,
      top_p: 1,
      stream: false,
    })

    // Record token usage after successful completion
    await RateLimiter.recordTokenUsage(
      user.id,
      'chatting',
      completion.usage?.total_tokens || Math.ceil(estimatedTokens)
    )

    return NextResponse.json({
      success: true,
      response: completion.choices[0]?.message?.content || 'No response generated',
      source: 'llm'
    })

  } catch (error) {
    console.error('Chat API Error:', error instanceof Error ? {
      message: error.message,
      stack: error.stack
    } : error)
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to process chat message',
        debug: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
} 