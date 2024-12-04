import { useState, useEffect, useRef } from "react";
import { Node, Edge } from "reactflow";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSupabase } from "@/lib/supabase/provider";
import { MessageSquare, ArrowLeft, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from "@/components/ui/alert-dialog"
import { isAdmin } from '@/lib/utils/adminCheck'

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
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState<{ title: string; description: string }>({
    title: '',
    description: ''
  })

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

        // Choose appropriate tables based on admin status
        const isAdminUser = isAdmin(user.id)
        const workflowTable = isAdminUser ? 'sample_workflows' : 'workflows'
        const faqTable = isAdminUser ? 'sample_faqs' : 'faqs'

        // Load workflow from appropriate table
        const { data: workflowData, error: workflowError } = await supabase
          .from(workflowTable)
          .select("*")
          .eq("id", workflowId)
          .single();

        if (workflowError) throw workflowError;

        // Load FAQs from appropriate table
        const { data: faqData, error: faqError } = await supabase
          .from(faqTable)
          .select("*")
          .eq("workflow_id", workflowId);

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

        // Skip chat session creation for admin users
        if (isAdmin(user.id)) return;

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

  const updateChatStats = async (responseTime: number, wasSuccessful: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || isAdmin(user.id)) return; // Skip for admin users
    
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
      // Get the session
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          // Add the auth token to the request
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          message: currentInput.trim(),
          workflowId: workflowId,
          history: messages.map(msg => ({
            role: msg.type === "user" ? "user" : "assistant",
            content: msg.content,
          })),
        }),
      });

      const data = await response.json();
      
      // Calculate response time
      const responseTime = new Date().getTime() - (lastMessageTime.current?.getTime() || 0);
      
      // Update chat statistics
      await updateChatStats(
        responseTime / 1000,
        data.success
      );

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            content: data.response,
            source: data.source
          },
        ]);
      } else {
        throw new Error(data.message);
      }
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

  const showAlert = (title: string, description: string) => {
    setAlertMessage({ title, description })
    setAlertOpen(true)
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="w-full py-3 bg-white/80 backdrop-blur-sm shadow-sm border-b">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-2xl font-bold text-blue-600">AnswerlyAI</span>
              </Link>
              <div className="hidden sm:flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
                <MessageSquare className="w-3 h-3 text-blue-600" />
                <span className="text-xs font-medium text-blue-600">
                  Chat Interface
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push(`/builder/${workflowId}`)}
                variant="ghost"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Editor
              </Button>
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  className="hidden md:flex items-center gap-2"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-4xl mx-auto w-full">
        <div className="flex flex-col flex-1">
          <div className="flex justify-between items-center py-4 px-6">
            <h1 className="text-xl font-semibold">Chat Assistant</h1>
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

      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertMessage.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {alertMessage.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAlertOpen(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
