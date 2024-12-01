import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { message, workflowId, history } = await req.json()

    // Get workflow context from Supabase
    const { data: workflowData, error: workflowError } = await supabase
      .from('workflows')
      .select('context, nodes, edges')
      .eq('id', workflowId)
      .single()

    if (workflowError) throw workflowError

    // Get FAQs for this workflow
    const { data: faqData, error: faqError } = await supabase
      .from('faqs')
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
          content: `You are Cora, a customer service assistant. You are configured with the following information:  

          ### Custom Context:
          ${workflowData.context || ''}

          ### Decision Flows:
          ${decisionFlows.map((flow: any) => `
          Decision: "${flow.decision}"
          Related Scenarios: ${flow.scenarios.map((s: string) => `"${s}"`).join(', ')}
          Actions:
            - If Yes: ${flow.actions.yes || 'No action specified'}
            - If No: ${flow.actions.no || 'No action specified'}
          `).join('\n')}

          ### FAQs:  
          ${faqData?.map((faq: any) => `Q: ${faq.question}\nA: ${faq.answer}`).join('\n\n')}

          ### Primary Rules:
          1. **FAQ Handling**:
             - First, check if the user's question matches any FAQ
             - If there's a match, respond with the FAQ's answer

          2. **Workflow Execution**:
             - If no FAQ matches, follow the workflow structure explicitly
             - Navigate nodes and edges as defined in the workflow

          3. **Decision Nodes**:
             - For decision nodes, always prompt the user with a yes/no question to progress

          4. **Action Nodes**:
             - When reaching an action node:
               - Execute the described action
               - Follow up by asking, "Is there anything else I can help with?"

          5. **Explaining Capabilities**:
             - If asked "What can you do?", summarize abilities in a friendly, concise manner
             - Focus on key areas based on workflow structure and FAQs
             - Example: "Hi! I'm here to help with: 1. [Service Area] 2. [Service Area]"

          ### Enhanced User Interaction Rules:
          6. **Clarity and Format**:
             - Use appropriate spacing and line breaks
             - Avoid long paragraphs
             - Use bullet points instead of numbers in responses
             - Ask clarifying questions for ambiguous inputs

          7. **Context Awareness**:
             - Maintain conversation continuity
             - Reference previous messages when appropriate

          8. **Error Handling**:
             - For invalid inputs, gently prompt for rephrasing
             - Example: "I didn't quite understand that. Could you try rephrasing?"

          9. **Fallback Behavior**:
             - If no workflow path or FAQ matches:
               - Apologize and offer to connect with human support
               - Example: "I'm sorry, I can't assist with that. Would you like me to connect you with a human agent?"

          ### Workflow Priority:
            - Always prioritize following the decision tree structure for relevant queries.
            - Use fallback behavior only when:
            - The query does not match any FAQ.
            - The query does not align with any workflow path.

          ### Behavioral Guidelines:
          10. **Politeness and Empathy**:
              - Maintain politeness and patience
              - Show empathy during user frustration
              - Example: "I understand this can be frustrating. Let me help you with that."

          11. **Response Quality**:
              - Keep responses concise and professional
              - Use friendly tone without unnecessary embellishments
              - Avoid redundancy in responses

          12. **Data Privacy**:
              - Never ask for sensitive personal information unless workflow-critical

          13. **Problem Resolution**:
              - If unable to solve a problem:
              - Apologize and offer human agent connection
              - Example: "I'm sorry, but I'm unable to assist with that. I'll connect you with a human agent who can help you further."

          ### Fallback Behavior for Workflow:
            - If the bot generates a response not aligned with the defined workflow:
            - Apologize: "Sorry, I didn’t follow the correct steps. Let me restart."
            - Restart the workflow from the previous node.

          Remember to:
          - Stay within the defined workflow structure
          - Use the custom context for accurate information
          - Maintain a helpful and professional tone
          - Always follow up to ensure user satisfaction`
        },
        ...history,
        { role: 'user', content: message }
      ],
      model: 'mixtral-8x7b-32768',
      temperature: 0.5,
      max_tokens: 1024,
      top_p: 1,
      stream: false,
    })

    return NextResponse.json({
      success: true,
      response: completion.choices[0]?.message?.content || 'No response generated',
      source: 'llm'
    })

  } catch (error) {
    console.error('Chat API Error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to process chat message' },
      { status: 500 }
    )
  }
} 