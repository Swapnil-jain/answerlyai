import { useState, useEffect, useRef } from "react";
import { Node, Edge } from "reactflow";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Header from "@/components/header";
import { useSupabase } from "@/lib/supabase/provider";

interface ChatMessage {
  type: "user" | "bot";
  content: string;
  source?: "llm";
}

interface FAQ {
  question: string;
  answer: string;
}

interface WorkflowChatbotProps {
  workflowId: string;
}

interface ChatSession {
  id: string;
  started_at: string;
  message_count: number;
  response_times: number[];
}

export default function WorkflowChatbot({ workflowId }: WorkflowChatbotProps) {
  const router = useRouter();
  const { supabase } = useSupabase();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [workflow, setWorkflow] = useState<{
    nodes: Node[];
    edges: Edge[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const lastMessageTime = useRef<Date>();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const loadWorkflowAndFAQs = async () => {
      try {
        setIsLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // Load workflow from Supabase instead of localStorage
        const { data: workflowData, error: workflowError } = await supabase
          .from("workflows")
          .select("*")
          .eq("id", workflowId)
          .single();

        if (workflowError) throw workflowError;

        // Load FAQs
        const { data: faqData, error: faqError } = await supabase
          .from("faqs")
          .select("*")
          .eq("user_id", user.id);

        if (faqError) throw faqError;
        setFaqs(faqData || []);

        if (workflowData) {
          setWorkflow({
            nodes: workflowData.nodes || [],
            edges: workflowData.edges || [],
          });
          setMessages([
            {
              type: "bot",
              content:
                "Hi 👋, I am Cora - Your very own chat assistant! How may I help you today?",
              source: "llm",
            },
          ]);
        } else {
          throw new Error("Workflow not found");
        }
      } catch (error) {
        console.error("Error loading:", error);
        setMessages([
          {
            type: "bot",
            content:
              "Sorry, there was an error loading. Please try again later.",
            source: "llm",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkflowAndFAQs();
  }, [workflowId, supabase]);

  useEffect(() => {
    const initializeChatSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('chat_sessions')
          .insert({
            user_id: user.id,
            workflow_id: workflowId,
            started_at: new Date().toISOString(),
            total_messages: 0,
            average_response_time: 0,
            successful_responses: 0
          })
          .select()
          .single();

        if (error) throw error;
        setCurrentSession({
          id: data.id,
          started_at: data.started_at,
          message_count: 0,
          response_times: []
        });
      } catch (error) {
        console.error('Error creating chat session:', error);
      }
    };

    initializeChatSession();

    // Cleanup function to end the session
    return () => {
      if (currentSession?.id) {
        endChatSession(currentSession.id).catch(console.error);
      }
    };
  }, [workflowId, supabase]);

  const processWithLLM = async (userInput: string) => {
    try {
      const scenarioContexts = workflow?.nodes
        .filter((node) => node.type === "scenario")
        .map((scenario) => {
          const connectedDecision = workflow.edges.find(
            (edge) => edge.source === scenario.id
          )?.target;

          const decisionNode = workflow.nodes.find(
            (node) => node.id === connectedDecision
          );

          return {
            scenario: scenario.data.label,
            decision: decisionNode?.data.label,
          };
        });

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userInput,
          context: `You are Cora, a customer service assistant. You are configured with the following information:  

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
                .join("\n")}  

              ### Rules for Interaction:  

              #### **Primary Rules**:  
              1. **FAQ Handling**:  
                - First, check if the user’s question matches any FAQ.  
                - If there’s a match, respond with the FAQ’s answer.  

              2. **Workflow Execution**:  
                - If no FAQ matches, follow the workflow structure explicitly.  
                - Navigate nodes and edges as defined in the workflow.  

              3. **Decision Nodes**:  
                - For decision nodes, always prompt the user with a yes/no question to progress.  

              4. **Action Nodes**:  
                - When reaching an action node:  
                  - Execute the described action.  
                  - Follow up by asking, *“Is there anything else I can help with?”*  

              5. **Explaining Capabilities**:  
                - If the user asks, "What can you do?" or a similar question:  
                  - Summarize your abilities in a **friendly, concise, and engaging manner**.  
                  - Focus only on key areas of assistance based on the workflow structure and available FAQs.  
                  - Avoid mentioning internal processes like how you handle errors or input validation unless directly asked.  

                Example Response:  
                - *"Hi! I’m here to help with:\n  
                    1. Refund related questions.\n  
                    2. Answering FAQs like business hours or how to reset your password.\n
                    Let me know how I can help you today!"*  

              6. **Handling Out-of-Scope Requests**:  
                - For requests outside the workflow or FAQs:  
                  - Politely explain your limitations.  
                  - Avoid fabricating or hallucinating answers.  

              7. **Response Quality**:  
                - Always keep responses concise, accurate, and professional.  
                - Use a friendly tone but avoid unnecessary embellishments.

              ---

              #### **Additional Rules for Enhanced User Interaction**:  
              8. **Clarification and Confirmation**:  
                - If a user’s input is ambiguous, ask clarifying questions before proceeding.  
                - Use approciate spacing and line breaks in your responses. Avoid long paragraphs or numbers in your lines. If numbers are present, try using bullet points.
                - Example: *“Could you please clarify your request?”*  

              9. **Context Awareness**:  
                - Maintain continuity in the conversation by referring to previous messages when appropriate.  
                - Example: If the user asked about "returns," ensure follow-up messages align with this topic.  

              10. **Error Handling**:  
                  - If a user provides an invalid or unexpected input:  
                    - Gently prompt them to rephrase or provide valid input.  
                    - Example: *“I didn’t quite understand that. Could you try rephrasing?”*  

              11. **Fallback Behavior**:  
                  - If no workflow path or FAQ matches:  
                    - Apologize and offer alternatives, like escalating to human support.  
                    - Example: *“I’m sorry, I can’t assist with that. Would you like me to connect you with a human agent?”*  

              ---

              #### **Behavioral and Operational Rules**:  
              12. **Politeness and Empathy**:  
                  - Always remain polite, empathetic, and patient, even when the user is frustrated.  
                  - Example: *“I understand this can be frustrating. Let me try to help you with that.”*  

              13. **Avoid Redundancy**:  
                  - If you’ve already answered a similar question in the current conversation, refer back instead of repeating verbatim.  
                  - Example: *“As I mentioned earlier, our return policy allows returns within 30 days.”*  

              14. **Timely Responses**:  
                  - Keep response times minimal to simulate real-time conversation.  

              15. **Data Privacy**:  
                  - Do not ask for sensitive personal information unless absolutely necessary and relevant to the workflow.  

              16. **Personalization**:  
                  - Use the user’s name (if available) for a more engaging interaction.  
                  - Example: *“Thank you, [User’s Name]. Here’s how I can assist you with your query.”*  

              ---

              ### Current Conversation History:  
              ${messages.map((m) => `${m.type}: ${m.content}`).join("\n")}`,
          history: messages.map((msg) => ({
            role: msg.type === "user" ? "user" : "assistant",
            content: msg.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to get response");
      }
      return data.response;
    } catch (error) {
      console.error("LLM Error:", error);
      return "I apologize, but I encountered an error. Please try again.";
    }
  };

  const updateChatStats = async (responseTime: number, wasSuccessful: boolean) => {
    if (!currentSession?.id) return;

    try {
      // First get the current values
      const { data: currentData, error: fetchError } = await supabase
        .from('chat_sessions')
        .select('total_messages, successful_responses')
        .eq('id', currentSession.id)
        .single();

      if (fetchError) throw fetchError;

      const newResponseTimes = [...currentSession.response_times, responseTime];
      const avgResponseTime = newResponseTimes.reduce((a, b) => a + b, 0) / newResponseTimes.length;

      // Then update with the new values
      await supabase
        .from('chat_sessions')
        .update({
          total_messages: (currentData?.total_messages || 0) + 1,
          average_response_time: avgResponseTime,
          successful_responses: (currentData?.successful_responses || 0) + (wasSuccessful ? 1 : 0)
        })
        .eq('id', currentSession.id);

      setCurrentSession(prev => prev ? {
        ...prev,
        message_count: prev.message_count + 1,
        response_times: newResponseTimes
      } : null);
    } catch (error) {
      console.error('Error updating chat stats:', error);
    }
  };

  const handleUserInput = async () => {
    if (!currentInput.trim()) return;

    // Record the time of the user's message
    lastMessageTime.current = new Date();

    setMessages((prev) => [
      ...prev,
      {
        type: "user",
        content: currentInput.trim(),
      },
    ]);

    setCurrentInput("");
    setIsLoading(true);

    try {
      const llmResponse = await processWithLLM(currentInput.trim());
      
      // Calculate response time
      const responseTime = new Date().getTime() - (lastMessageTime.current?.getTime() || 0);
      
      // Update chat statistics
      await updateChatStats(
        responseTime / 1000, // Convert to seconds
        true // Assume success if we got a response
      );

      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          content: llmResponse,
          source: "llm",
        },
      ]);
    } catch (error) {
      console.error("Error processing input:", error);
      
      // Update chat statistics with failed response
      if (lastMessageTime.current) {
        const responseTime = new Date().getTime() - lastMessageTime.current.getTime();
        await updateChatStats(responseTime / 1000, false);
      }

      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          content: "I apologize, but I encountered an error. Please try again.",
          source: "llm",
        },
      ]);
    }

    setIsLoading(false);
  };

  const endChatSession = async (sessionId: string) => {
    try {
      await supabase
        .from('chat_sessions')
        .update({
          ended_at: new Date().toISOString()
        })
        .eq('id', sessionId);
    } catch (error) {
      console.error('Error ending chat session:', error);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b">
        <div className="flex items-center gap-4">
          <a href="/" className="text-xl font-semibold text-blue-600">
            AnswerlyAI
          </a>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="/how-it-works"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            How it works
          </a>
          <a
            href="/waitlist"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Waitlist
          </a>
          <a
            href="/pre-launch"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Pre-launch offer
          </a>
          <a
            href="/builder"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Workflow
          </a>
        </div>
      </div>

      <div className="flex flex-col flex-1 max-w-4xl mx-auto w-full">
        <div className="flex justify-between items-center py-4 px-6">
          <h1 className="text-xl font-semibold">Chat Assistant</h1>
          <Button
            onClick={() => router.push(`/builder/${workflowId}`)}
            variant="outline"
            className="flex items-center gap-2 text-sm"
          >
            « Back to Workflow Editor
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.type === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2 text-gray-800">
                  Typing...
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleUserInput();
                }
              }}
              placeholder="Type your message..."
              className="flex-1 border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button
              onClick={handleUserInput}
              disabled={isLoading || !currentInput.trim()}
              className="bg-black text-white hover:bg-gray-800"
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
