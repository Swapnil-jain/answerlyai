import { useState, useEffect, useRef } from "react";
import { Node, Edge } from "reactflow";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSupabase } from "@/lib/supabase/provider";
import { MessageSquare, ArrowLeft, LayoutDashboard} from "lucide-react";
import Link from "next/link";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from "@/components/ui/alert-dialog"
import { isAdmin } from '@/lib/utils/adminCheck'
import { workflowCache } from "@/lib/cache/workflowCache";
import ReactMarkdown from 'react-markdown';
import Image from "next/image";

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

interface CachedWorkflow {
  id: string;
  nodes: Node[];
  edges: Edge[];
}

interface PaginationOptions {
  page: number;
  limit: number;
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
  const [faqPage, setFaqPage] = useState(1)
  const [hasMoreFaqs, setHasMoreFaqs] = useState(true)
  const FAQ_PAGE_SIZE = 20

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (workflowId) {
      loadWorkflowAndFAQs()
    }
  }, [workflowId, supabase])

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

      // Try to get workflow from cache first
      const cachedWorkflow = workflowCache.getWorkflow(workflowId)
      if (cachedWorkflow) {
        setWorkflow({
          nodes: cachedWorkflow.nodes || [],
          edges: cachedWorkflow.edges || [],
        })
      } else {
        // Load workflow from database
        const { data: workflowData, error: workflowError } = await supabase
          .from(workflowTable)
          .select("*")
          .eq("id", workflowId)
          .single()

        if (workflowError) throw workflowError

        if (workflowData) {
          setWorkflow({
            nodes: workflowData.nodes || [],
            edges: workflowData.edges || [],
          })
          workflowCache.setWorkflow(workflowData)
        }
      }

      // Try to get FAQs from cache first
      const cachedFaqs = workflowCache.getPaginatedFAQs(workflowId, {
        pagination: { page: faqPage, limit: FAQ_PAGE_SIZE }
      })

      if (cachedFaqs) {
        setFaqs(prevFaqs => [...prevFaqs, ...cachedFaqs.data])
        setHasMoreFaqs(cachedFaqs.total > faqPage * FAQ_PAGE_SIZE)
      } else {
        // Load FAQs from database with pagination
        const { data: faqData, error: faqError } = await supabase
          .from(faqTable)
          .select("*", { count: 'exact' })
          .eq("workflow_id", workflowId)
          .range((faqPage - 1) * FAQ_PAGE_SIZE, faqPage * FAQ_PAGE_SIZE - 1)

        if (faqError) throw faqError

        if (faqData) {
          setFaqs(prevFaqs => [...prevFaqs, ...faqData])
          workflowCache.setPaginatedFAQs(workflowId, faqData, {
            pagination: { offset: (faqPage - 1) * FAQ_PAGE_SIZE }
          })
          setHasMoreFaqs(faqData.length === FAQ_PAGE_SIZE)
        }
      }

      // Set initial message
      if (messages.length === 0) {
        setMessages([{
          type: "bot",
          content: "Hi 👋, I am Cora - Your very own chat assistant! How may I help you today?",
          source: "llm",
        }])
      }
    } catch (error) {
      setMessages([{
        type: "bot",
        content: "Sorry, there was an error loading. Please try again later.",
        source: "llm",
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const loadMoreFaqs = () => {
    if (!hasMoreFaqs || isLoading) return
    setFaqPage(prev => prev + 1)
  }

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
    }
  };

  const handleUserInput = async () => {
    if (!currentInput.trim()) return;

    lastMessageTime.current = new Date();
    setIsLoading(true);

    // Optimistically add user message
    setMessages((prev) => [
      ...prev,
      {
        type: "user",
        content: currentInput.trim(),
      },
    ]);

    const userMessage = currentInput.trim();
    setCurrentInput("");

    try {
      // Get the session
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          message: userMessage,
          workflowId: workflowId,
          history: messages.map(msg => ({
            role: msg.type === "user" ? "user" : "assistant",
            content: msg.content,
          })),
        }),
      });

      const data = await response.json();
      
      // Set loading to false immediately after receiving response
      setIsLoading(false);
      
      // Calculate response time
      const responseTime = new Date().getTime() - (lastMessageTime.current?.getTime() || 0);
      
      // Optimistically update chat statistics before checking success
      if (currentSession?.id) {
        setCurrentSession(prev => prev ? {
          ...prev,
          message_count: prev.message_count + 1,
          response_times: [...prev.response_times, responseTime / 1000]
        } : null);
      }

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            content: data.response,
            source: data.source
          },
        ]);
        // Update stats after confirmed success
        await updateChatStats(responseTime / 1000, true);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {      
      // Update chat statistics with failed response
      if (lastMessageTime.current) {
        const responseTime = new Date().getTime() - lastMessageTime.current.getTime();
        await updateChatStats(responseTime / 1000, false);
      }

      // Revert optimistic session update on error
      if (currentSession?.id) {
        setCurrentSession(prev => prev ? {
          ...prev,
          message_count: Math.max(0, prev.message_count - 1),
          response_times: prev.response_times.slice(0, -1)
        } : null);
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
                <Image src="/logo.png" alt="AnswerlyAI Logo" width={40} height={40} />
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
                    className={`max-w-[80%] rounded-lg px-4 py-2 text-base ${
                      message.type === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-800 prose prose-base max-w-none"
                    }`}
                  >
                    {message.type === "user" ? (
                      message.content
                    ) : (
                      <ReactMarkdown>
                        {message.content}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-4 py-2 text-gray-800 flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
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
                className="flex-1 border rounded-md px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
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
