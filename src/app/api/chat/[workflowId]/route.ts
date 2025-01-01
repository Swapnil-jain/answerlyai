import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateDynamicSystemPrompt, determinePromptTypes, findRelevantFaqs, PromptType } from '@/lib/utils/promptManager'
import { RateLimiter } from '@/lib/utils/rateLimiter'
import { isAdmin } from '@/lib/utils/adminCheck'
import { chunkText, findRelevantChunks } from '@/lib/utils/textChunker'
import { EmailData } from '@/lib/utils/email'
import { handleEmailActions } from '../email-handler'
import { ContextCacheManager, SectionType } from '@/lib/utils/contextCache'
import { WorkflowManager } from '@/lib/utils/workflowManager'
import { SessionManager } from '@/lib/utils/sessionManager'

//API Route which is used by the snippet which will be used by the client website.

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    // Initialize or get session - use domain as session ID for widgets
    let sessionId = req.headers.get('x-session-id');
    if (!sessionId) {
      // For widgets, use a combination of origin and timestamp as session ID
      const origin = req.headers.get('origin') || 'anonymous';
      sessionId = `widget_${origin}_${Date.now()}`;
      SessionManager.initSession(sessionId); // Use sessionId instead of userId
    }

    // Check if user is admin using the adminCheck utility
    const isAdminUser = isAdmin(userId);
    const workflowTable = isAdminUser ? 'sample_workflows' : 'workflows';
    const faqTable = isAdminUser ? 'sample_faqs' : 'faqs';

    // Get workflow data
    const { data: workflowData, error: workflowError } = await supabase
      .from(workflowTable)
      .select('*')
      .eq('id', workflowId)
      .single();

    if (workflowError) throw workflowError;

    // Get FAQs
    const { data: faqData, error: faqError } = await supabase
      .from(faqTable)
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
      sessionId,  // Use the widget session ID
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

    // Get optimized context using the new method
    const contextToUse = await getRelevantContext(workflowData, message);

    // Generate optimized prompt
    const systemPrompt = generateDynamicSystemPrompt(
      contextToUse,
      faqData.filter(faq => newFAQs.includes(faq.id)),
      newPromptTypes as PromptType[],
      workflowContext?.structure,
      workflowContext?.currentNode,
      req.headers.get('X-Assistant-Name') || 'Cora'
    );

    // Estimate token usage with detailed breakdown
    const tokenUsage = await RateLimiter.estimateTokenUsage(
      message,
      history,
      systemPrompt.length,
      relevantFaqIds.reduce((len, id) => len + (faqData.find(f => f.id === id)?.answer.length || 0), 0),
      JSON.stringify(workflowContext).length,
      contextToUse.length
    );

    // Check rate limits with total tokens
    const rateLimitCheck = await RateLimiter.checkRateLimit(
      userId,
      tokenUsage.total
    );

    if (!rateLimitCheck.allowed) {
      return new NextResponse(
        JSON.stringify({ success: false, message: rateLimitCheck.reason }),
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

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

            await handleEmailActions(userId, emailAction);
          }
        } catch (emailError) {
          
          // Continue with the response even if email fails
        }
      }

      // Record detailed token usage
      await RateLimiter.recordDetailedTokenUsage(userId, {
        ...tokenUsage,
        total: response.usage.total_tokens // Use actual tokens from API response
      });

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
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    
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