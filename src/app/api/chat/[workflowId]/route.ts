import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Node, Edge } from 'reactflow';
import { headers } from 'next/headers';
import { Groq } from 'groq-sdk';


//API Route which is used by the snippet which will be used by the client website.

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

// Add this interface for type safety
interface ScenarioContext {
  scenario: string;
  decision: string | undefined;
}

export async function POST(
  request: Request,
  context: { params: { workflowId: string } }
) {
  try {
    const headersList = await headers();
    const origin = headersList.get('origin') || '*';
    
    // Await params before accessing workflowId
    const resolvedParams = await context.params;
    const workflowId = resolvedParams?.workflowId;

    if (!workflowId) {
      throw new Error('workflowId is missing in params.');
    }

    const { message, history = [] } = await request.json();
    console.log('Processing chat request:', { message, workflowId });

    // Verify workflow exists first
    const { data: workflowExists, error: checkError } = await supabase
      .from('workflows')
      .select('id')
      .eq('id', workflowId);

    if (checkError || !workflowExists?.length) {
      console.error('Workflow does not exist:', workflowId);
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: `Workflow with ID ${workflowId} not found. Please create a workflow first.`,
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      );
    }

    // Fetch full workflow data
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .single();

    if (workflowError) {
      console.error('Workflow fetch error:', workflowError);
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: 'Workflow not found. Please check the workflow ID.',
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      );
    }

    // Fetch FAQs for this workflow's user
    const { data: faqs, error: faqError } = await supabase
      .from('faqs')
      .select('*')
      .eq('user_id', workflow.user_id);

    if (faqError) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: 'Error fetching FAQs',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      );
    }

    // Extract scenario contexts from the workflow
    const scenarioContexts: ScenarioContext[] = workflow.nodes
      .filter((node: Node) => node.type === 'scenario')
      .map((scenario: Node) => {
        const connectedDecision = workflow.edges.find(
          (edge: Edge) => edge.source === scenario.id
        )?.target;

        const decisionNode = workflow.nodes.find(
          (node: Node) => node.id === connectedDecision
        );

        return {
          scenario: scenario.data.label,
          decision: decisionNode?.data.label,
        };
      });

    // Create the system prompt
    const systemPrompt = `You are Cora, a customer service assistant. You are configured with the following information:  

    ### Workflow Structure:  
    ${JSON.stringify(workflow, null, 2)}  

    ### FAQs:  
    ${JSON.stringify(faqs, null, 2)}  

    ### Scenario Contexts:  
    ${scenarioContexts
      ?.map(
        (ctx) =>
          `When: ${ctx.scenario}
      Then ask: ${ctx.decision}`
      )
      .join('\n')}  

    ### Rules for Interaction:  
    1. First check if the user's question matches any FAQ and respond with the FAQ answer if found
    2. If no FAQ matches, follow the workflow structure to guide the conversation
    3. For decision nodes, ask the user the question to determine the path
    4. For action nodes, execute the described action and ask if there's anything else needed
    5. Keep responses concise, friendly, and professional
    6. Use appropriate spacing and formatting in responses
    7. If a request is outside the workflow or FAQs, politely explain the limitations

    ### Current Conversation History:  
    ${history.map((msg: { role: string; content: string }) => 
      `${msg.role}: ${msg.content}`
    ).join('\n')}`;

    // Get response from Groq
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: message,
        },
      ],
      model: 'mixtral-8x7b-32768',
      temperature: 0.5,
      max_tokens: 1024,
    });

    const response = completion.choices[0]?.message?.content || 
      "I apologize, but I couldn't generate a response. Please try again.";

    return new NextResponse(
      JSON.stringify({
        success: true,
        response
      }), 
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin,
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

export async function OPTIONS(
  request: Request,
  { params }: { params: { workflowId: string } }
) {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 