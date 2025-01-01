import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { 
  generateDynamicSystemPrompt, 
  determinePromptTypes, 
  findRelevantFaqs,
  PromptType 
} from '@/lib/utils/promptManager';
import { RateLimiter } from '@/lib/utils/rateLimiter'
import { isAdmin } from '@/lib/utils/adminCheck'
import { chunkText, findRelevantChunks } from '@/lib/utils/textChunker'
import { handleEmailActions } from './email-handler'
import { EmailData } from '@/lib/utils/email'
import { SessionManager } from '@/lib/utils/sessionManager';
import { WorkflowManager } from '@/lib/utils/workflowManager';
import { ContextCacheManager, SectionType } from '@/lib/utils/contextCache';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Add context section loading
const getRelevantContext = async (
  workflowData: any, 
  message: string
): Promise<string> => {
  // Try section-based approach first
  const sections: Record<SectionType, RegExp> = {
    shipping: /shipping|delivery|track|order status/i,
    returns: /return|refund|exchange/i,
    warranty: /warranty|damaged|repair/i,
    contact: /contact|support|help|email/i
  };

  let relevantContent = '';
  const context = workflowData.context || '';
  
  // Try section-based lookup first
  function isSectionType(section: string): section is SectionType {
    return ['shipping', 'returns', 'warranty', 'contact'].includes(section);
  }

  for (const [section, pattern] of Object.entries(sections)) {
    if (pattern.test(message) && isSectionType(section)) {
      const sectionContent = await ContextCacheManager.getContextSection(
        workflowData.id,
        section
      );
      
      if (sectionContent) {
        relevantContent += sectionContent + '\n';
      } else {
        const sectionMatch = context.match(
          new RegExp(`\\*\\*${section}[^*]+\\*\\*([^*]+)`, 'i')
        );
        if (sectionMatch) {
          await ContextCacheManager.setContextSection(
            workflowData.id,
            section,
            sectionMatch[1]
          );
          relevantContent += sectionMatch[1] + '\n';
        }
      }
    }
  }

  // If no relevant sections found, fall back to chunk-based approach
  if (!relevantContent) {
    const cacheKey = ContextCacheManager.generateCacheKey(context);
    const cachedContext = await ContextCacheManager.getContext(cacheKey);
    
    if (cachedContext) {
      return cachedContext.content;
    }

    const chunks = chunkText(context);
    const relevantChunks = findRelevantChunks(chunks, message);
    
    await ContextCacheManager.setContext(
      cacheKey, 
      relevantChunks, 
      chunks.reduce((acc, chunk) => acc + chunk.tokens, 0)
    );

    return relevantChunks;
  }

  return relevantContent;
};

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

    // Initialize or get session
    let sessionId = req.headers.get('x-session-id');
    if (!sessionId) {
      sessionId = SessionManager.initSession(user.id);
    }

    // Get workflow data and FAQs
    const { data: workflowData, error: workflowError } = await supabase
      .from(isAdmin(user.id) ? 'sample_workflows' : 'workflows')
      .select('context, nodes, edges')
      .eq('id', workflowId)
      .single();

    if (workflowError) throw workflowError;

    // Use getRelevantContext instead of the old context optimization
    const contextToUse = await getRelevantContext(workflowData, message);

    // Get FAQs and continue with existing flow...
    const { data: faqData, error: faqError } = await supabase
      .from(isAdmin(user.id) ? 'sample_faqs' : 'faqs')
      .select('*')
      .eq('workflow_id', workflowId);

    if (faqError) throw faqError;

    // Determine required prompt types based on message
    const promptTypes = determinePromptTypes(message, history);
    
    // Get relevant FAQ IDs
    const relevantFaqs = findRelevantFaqs(faqData, message);
    const relevantFaqIds = relevantFaqs.map(faq => faq.id);

    // Get only new context needed
    const { 
      newPromptTypes, 
      newFAQs, 
      workflowState 
    } = SessionManager.getRequiredContext(
      sessionId,
      promptTypes,
      relevantFaqIds
    );

    // Get relevant workflow section
    const workflowContext = workflowData ? {
      currentNode: workflowState.currentNode,
      structure: (() => {
        // Get relevant section first
        const relevantSection = WorkflowManager.getRelevantWorkflowSection(
          workflowData.nodes,
          workflowData.edges,
          workflowState.currentNode,
          2,  // depth
          message // to match scenarios
        );

        // Then structure it
        return {
          nodes: relevantSection.nodes.map(n => ({
            id: n.id,
            type: n.type,
            label: n.data.label
          })),
          edges: relevantSection.edges.map(e => ({
            source: e.source,
            target: e.target,
            handle: e.sourceHandle
          }))
        };
      })()
    } : null;

    // Generate optimized prompt with the new context
    const systemPrompt = generateDynamicSystemPrompt(
      contextToUse,  // Using the section-based context
      faqData.filter(faq => newFAQs.includes(faq.id)),
      newPromptTypes as PromptType[],
      workflowContext?.structure,
      workflowContext?.currentNode
    );

    // Estimate token usage with detailed breakdown
    const tokenUsage = await RateLimiter.estimateTokenUsage(
      message,
      history,
      systemPrompt.length,
      newFAQs.reduce((len, id) => len + (faqData.find(f => f.id === id)?.answer.length || 0), 0),
      JSON.stringify(workflowContext).length,
      contextToUse.length
    );

    // Check rate limits with total tokens
    const rateLimitCheck = await RateLimiter.checkRateLimit(
      user.id,
      tokenUsage.total
    );

    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { success: false, message: rateLimitCheck.reason },
        { status: 429 }
      );
    }

    // Make the API call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    try {
      const completion = await fetch('https://api.deepinfra.com/v1/openai/chat/completions', {
        signal: controller.signal,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.DEEPINFRA_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'Qwen/Qwen2.5-Coder-32B-Instruct',
          temperature: 0,
          max_tokens: 512,
          messages: [
            { role: 'system', content: systemPrompt },
            ...history.slice(-5),
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
      
      if (!response?.choices?.[0]?.message?.content) {
        throw new Error('Invalid API response structure');
      }

      // Extract and handle email actions from the response
      const responseText = response.choices[0]?.message?.content || '';
      if (responseText.includes('[EMAIL_ACTION:')) {
        try {
          const actionMatch = responseText.match(/\[EMAIL_ACTION:(.*?)\]/);
          if (actionMatch) {
            const actionType = actionMatch[1].trim().toLowerCase();
            
            // Extract email content between quotes
            const emailContentMatch = responseText.match(/"([^"]+)"/);
            if (!emailContentMatch) {
              throw new Error('No properly formatted email content found');
            }
            
            const messageContent = emailContentMatch[1].trim();
            
            // Generate a more specific subject based on action type
            let subject = '';
            switch (actionType) {
              case 'support':
                subject = 'Customer Support Request - Order Issue';
                break;
              case 'feedback':
                subject = 'Customer Feedback';
                break;
              case 'meeting':
                subject = 'Meeting Request';
                break;
              default:
                subject = `${actionType.charAt(0).toUpperCase() + actionType.slice(1)} Request`;
            }
            
            // Create email data based on type
            let emailAction: EmailData;
            if (actionType === 'meeting') {
              const extractMeetingDetails = (content: string) => {
                const timeZone = "Asia/Kolkata"; // IST timezone
                const lines = content.split('\n');
                let dateStr = '';
                let timeStr = '';
                
                for (const line of lines) {
                  if (line.includes('Date:')) {
                    dateStr = line.split('Date:')[1].trim();
                  }
                  if (line.includes('Time:')) {
                    timeStr = line.split('Time:')[1].split('IST')[0].trim();
                  }
                }

                // Parse date string (e.g., "Tuesday, December 17, 2024")
                const date = new Date(dateStr);
                
                // Parse time string (e.g., "8:00 PM")
                const [timeNum, period] = timeStr.split(' ');
                const [hours, minutes] = timeNum.split(':');
                let hour = parseInt(hours);
                if (period.toUpperCase() === 'PM' && hour !== 12) {
                  hour += 12;
                } else if (period.toUpperCase() === 'AM' && hour === 12) {
                  hour = 0;
                }
                
                // Combine date and time
                const startTime = new Date(date);
                startTime.setHours(hour, parseInt(minutes), 0, 0);
                const endTime = new Date(startTime.getTime() + 30 * 60000); // 30 minutes duration
                
                return {
                  start: startTime,
                  end: endTime,
                  timeZone
                };
              };
              const meetingDetails = extractMeetingDetails(messageContent);
              emailAction = {
                type: 'meeting',
                data: {
                  subject,
                  content: messageContent,
                  startTime: meetingDetails.start,
                  endTime: meetingDetails.end,
                  description: messageContent
                }
              };
            } else if (actionType === 'feedback' || actionType === 'support') {
              emailAction = {
                type: actionType,
                data: {
                  subject,
                  content: messageContent
                }
              };
            } else {
              throw new Error('Invalid email action type');
            }

            await handleEmailActions(user.id, emailAction);
          }
        } catch (emailError) {
          console.error('Email action error:', emailError);
          // Continue with the response even if email fails
        }
      }

      // Record detailed token usage
      await RateLimiter.recordDetailedTokenUsage(user.id, {
        ...tokenUsage,
        total: response.usage.total_tokens // Use actual tokens from API response
      });
      
      return NextResponse.json({
        success: true,
        response: response.choices[0]?.message?.content || 'No response generated',
        source: 'llm',
        sessionId,
        tokenUsage
      });
    } finally {
      clearTimeout(timeoutId);
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