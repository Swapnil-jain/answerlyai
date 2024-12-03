import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Groq } from 'groq-sdk'
import { generateSystemPrompt } from '@/lib/utils/chatPrompts'
// import { RateLimiter } from '@/lib/utils/rateLimiter'

//API Route which is used by the snippet which will be used by the client website.

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

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
    console.log('Request origin:', origin);

    const { message, history = [] } = await req.json();

    // // Estimate token count
    // const estimatedTokens = message.length / 4 + 
    //   history.reduce((acc: number, msg: any) => acc + msg.content.length / 4, 0);

    // // Check rate limits
    // const rateLimitCheck = await RateLimiter.checkRateLimit(
    //   user.id,
    //   'chatting',
    //   Math.ceil(estimatedTokens)
    // );

    // if (!rateLimitCheck.allowed) {
    //   return new NextResponse(
    //     JSON.stringify({ 
    //       success: false, 
    //       message: rateLimitCheck.reason 
    //     }),
    //     { 
    //       status: 429,
    //       headers: {
    //         'Content-Type': 'application/json',
    //         'Access-Control-Allow-Origin': '*',
    //       },
    //     }
    //   );
    // }

    // Get workflow data from Supabase
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .single();

    if (workflowError) throw workflowError;

    // Get FAQs for this workflow
    const { data: faqData, error: faqError } = await supabase
      .from('faqs')
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

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: generateSystemPrompt(workflow.context, decisionFlows, faqData)
        },
        ...history,
        { role: 'user', content: message }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0,
      max_tokens: 1024,
      top_p: 1,
      stream: false,
    });

    // // Record token usage
    // await RateLimiter.recordTokenUsage(
    //   user.id,
    //   'chatting',
    //   completion.usage?.total_tokens || Math.ceil(estimatedTokens)
    // );

    return new NextResponse(
      JSON.stringify({
        success: true,
        response: completion.choices[0]?.message?.content || 'No response generated',
        source: 'llm'
      }), 
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );

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
          'Access-Control-Allow-Headers': 'Content-Type',
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}