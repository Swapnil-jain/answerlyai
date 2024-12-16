import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateSystemPrompt } from '@/lib/utils/chatPrompts'
import { RateLimiter } from '@/lib/utils/rateLimiter'
import { isAdmin } from '@/lib/utils/adminCheck'
import { chunkText, findRelevantChunks } from '@/lib/utils/textChunker'

//API Route which is used by the snippet which will be used by the client website.

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // Extract the `workflowId` from the URL
    const url = new URL(req.url);
    const workflowId = url.pathname.split('/').pop(); // Get the last part of the path

    if (!workflowId) {
      throw new Error('Workflow ID is required');
    }

    // Remove auth check for widget requests
    // Instead, verify the request origin if needed
    const origin = req.headers.get('origin');

    // Get userId from header or use domain as fallback
    const userId = req.headers.get('X-User-ID') || 
                  (origin ? new URL(origin).hostname : 'anonymous');

    const { message, history = [] } = await req.json();

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
      userId,
      estimatedTokens
    )

    if (!rateLimitCheck.allowed) {
      return new NextResponse(
        JSON.stringify({ 
          success: false, 
          message: rateLimitCheck.reason 
        }),
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Check if user is admin using the adminCheck utility
    const isAdminUser = isAdmin(userId);
    const workflowTable = isAdminUser ? 'sample_workflows' : 'workflows';
    const faqTable = isAdminUser ? 'sample_faqs' : 'faqs';

    // Get workflow data
    const { data: workflow, error: workflowError } = await supabase
      .from(workflowTable)
      .select('*')
      .eq('id', workflowId)
      .single();

    if (workflowError) throw workflowError;

    // Calculate total tokens for the context
    const MAX_CONTEXT_TOKENS = 6000  // leaving room for system prompt and chat history
    const contextTokens = Math.ceil((workflow.context?.length || 0) / CHARS_PER_TOKEN)

    // Only use chunking if context is too large
    let contextToUse = workflow.context || ''
    if (contextTokens > MAX_CONTEXT_TOKENS) {
      console.log('Context too large, using chunking...')
      const contextChunks = chunkText(workflow.context || '')
      contextToUse = findRelevantChunks(contextChunks, message)
    }

    // Get FAQs for this workflow
    const { data: faqData, error: faqError } = await supabase
      .from(faqTable)
      .select('*')
      .eq('workflow_id', workflowId);

    if (faqError) throw faqError;

    // Improved scenario and decision mapping
    const decisionFlows = workflow.nodes
      ?.filter((node: any) => node.type === "start")
      .map((startNode: any) => {
        const connectedDecisions = workflow.edges
          ?.filter((edge: any) => edge.source === startNode.id)
          .map((edge: any) => {
            const decisionNode = workflow.nodes?.find(
              (node: any) => node.id === edge.target && node.type === "decision"
            );
            if (!decisionNode) return null;

            const scenarios = workflow.edges
              ?.filter((e: any) => e.target === decisionNode.id)
              .map((e: any) => {
                const scenarioNode = workflow.nodes?.find(
                  (n: any) => n.id === e.source && n.type === "scenario"
                );
                return scenarioNode?.data.label;
              })
              .filter(Boolean);

            const yesAction = workflow.edges
              ?.find((e: any) => e.source === decisionNode.id && e.sourceHandle === "yes");
            const noAction = workflow.edges
              ?.find((e: any) => e.source === decisionNode.id && e.sourceHandle === "no");

            const yesActionNode = workflow.nodes?.find(
              (n: any) => n.id === yesAction?.target && n.type === "action"
            );
            const noActionNode = workflow.nodes?.find(
              (n: any) => n.id === noAction?.target && n.type === "action"
            );

            return {
              decision: decisionNode.data.label,
              scenarios: scenarios,
              actions: {
                yes: yesActionNode?.data.label,
                no: noActionNode?.data.label
              }
            };
          })
          .filter(Boolean);

        return connectedDecisions;
      })
      .flat();

    // Get assistant name from header or use default
    const assistantName = req.headers.get('X-Assistant-Name') || 'Cora';

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
              content: generateSystemPrompt(contextToUse, decisionFlows, faqData, assistantName)
            },
            ...history,
            { role: 'user', content: message }
          ]
        })
      });

      const response = await completion.json();
      console.log('LLM Response:', response.usage);

      // Record token usage
      await RateLimiter.recordTokenUsage(
        userId,
        response.usage.total_tokens
      );

      return new NextResponse(
        JSON.stringify({
          success: true,
          response: response.choices[0].message.content || 'No response generated',
          source: 'llm'
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-User-ID, X-Assistant-Name',
          },
        }
      );
    } catch (error: any) {
      console.error('LLM API Error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Chat API Error:', error);
    return new NextResponse(
      JSON.stringify({ 
        success: false, 
        message: error instanceof Error 
          ? error.message 
          : 'Failed to process chat request'
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-User-ID, X-Assistant-Name',
        },
      }
    );
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-User-ID, X-Assistant-Name',
    },
  });
}