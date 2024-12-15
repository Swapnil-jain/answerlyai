import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateSystemPrompt } from '@/lib/utils/chatPrompts';
import { RateLimiter } from '@/lib/utils/rateLimiter'
import { isAdmin } from '@/lib/utils/adminCheck'

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

    // Estimate token count with overhead for system prompts and special tokens
    const CHARS_PER_TOKEN = 4
    const SYSTEM_PROMPT_OVERHEAD = 200 // tokens for system prompt, formatting
    
    const estimatedTokens = Math.ceil(
      (message.length / CHARS_PER_TOKEN) + // current message
      (history.reduce((acc: number, msg: any) => acc + msg.content.length, 0) / CHARS_PER_TOKEN) + // history
      SYSTEM_PROMPT_OVERHEAD // overhead for system prompts and formatting
    )

    // Check rate limits
    const rateLimitCheck = await RateLimiter.checkRateLimit(
      user.id,
      estimatedTokens
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

    try {
      const completion = await fetch('https://api.deepinfra.com/v1/openai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.DEEPINFRA_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'meta-llama/Meta-Llama-3-8B-Instruct',
          temperature: 0,
          max_tokens: 1024,
          messages: [
            {
              role: 'system',
              content: generateSystemPrompt(workflowData.context, decisionFlows, faqData)
            },
            ...history,
            { role: 'user', content: message }
          ]
        })
      });

      if (!completion.ok) {
        const error = await completion.text()
        console.error('LLM API Error:', error)
        return NextResponse.json(
          { success: false, message: 'Failed to generate response' },
          { status: 500 }
        )
      }

      const response = await completion.json();

      // Record token usage
      const tokenCount = response.usage.total_tokens;
      console.log('Recording token usage:', { userId: user.id, tokenCount });
      
      await RateLimiter.recordTokenUsage(
        user.id,
        tokenCount
      );

      return NextResponse.json({
        success: true,
        response: response.choices[0]?.message?.content || 'No response generated',
        source: 'llm'
      });
    } catch (error: any) {
      console.error('LLM API Error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to generate response' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Chat API Error:', error instanceof Error ? {
      message: error.message,
      stack: error.stack
    } : error)
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to process chat message'
      },
      { status: 500 }
    )
  }
} 