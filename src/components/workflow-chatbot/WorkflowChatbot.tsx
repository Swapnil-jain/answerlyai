import { useState, useEffect, useRef } from 'react'
import { Node, Edge } from 'reactflow'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Header from '@/components/header'

interface ChatMessage {
  type: 'user' | 'bot'
  content: string
  source?: 'llm'
}

interface WorkflowChatbotProps {
  workflowId: string
}

export default function WorkflowChatbot({ workflowId }: WorkflowChatbotProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentInput, setCurrentInput] = useState('')
  const [workflow, setWorkflow] = useState<{ nodes: Node[]; edges: Edge[] } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const loadWorkflow = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/load-workflow?id=${workflowId}`)
        const data = await response.json()

        if (data.success && data.workflow) {
          setWorkflow(data.workflow)
          setMessages([{ 
            type: 'bot', 
            content: "Hi 👋, I am Cora - Your very own chat assistant! How may I help you today?",
            source: 'llm'
          }])
        } else {
          console.error('Failed to load workflow:', data)
          setMessages([{ 
            type: 'bot', 
            content: "Sorry, I couldn't load the workflow. Please try again later.",
            source: 'llm'
          }])
        }
      } catch (error) {
        console.error('Error loading workflow:', error)
        setMessages([{ 
          type: 'bot', 
          content: "Sorry, there was an error loading the workflow. Please try again later.",
          source: 'llm'
        }])
      } finally {
        setIsLoading(false)
      }
    }

    loadWorkflow()
  }, [workflowId])

  const processWithLLM = async (userInput: string) => {
    try {
      const scenarioContexts = workflow?.nodes
        .filter(node => node.type === 'scenario')
        .map(scenario => {
          const connectedDecision = workflow.edges
            .find(edge => edge.source === scenario.id)
            ?.target

          const decisionNode = workflow.nodes
            .find(node => node.id === connectedDecision)

          return {
            scenario: scenario.data.label,
            decision: decisionNode?.data.label
          }
        })

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userInput,
          context: `You are Cora, a customer service assistant. You are configured with this exact workflow:
                   ${JSON.stringify(workflow, null, 2)}

                   Scenario Contexts:
                   ${scenarioContexts?.map(ctx => 
                     `When: ${ctx.scenario}
                      Then ask: ${ctx.decision}`
                   ).join('\n')}

                   Rules:
                   1. You can ONLY help with scenarios defined in this workflow
                   2. Follow the exact flow defined by the nodes and edges
                   3. For decision nodes, always ask for yes/no answers
                   4. When reaching an action node, execute it and ask if there's anything else
                   5. If user asks what you can do, explain based on the workflow structure and available scenarios
                   6. For any request outside this workflow, politely explain you can only help with what's defined in the workflow
                   
                   Current conversation history:
                   ${messages.map(m => `${m.type}: ${m.content}`).join('\n')}`,
          history: messages.map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
          }))
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.message || 'Failed to get response')
      }
      return data.response
    } catch (error) {
      console.error('LLM Error:', error)
      return "I apologize, but I encountered an error. Please try again."
    }
  }

  const handleUserInput = async () => {
    if (!currentInput.trim()) return

    setMessages(prev => [...prev, { 
      type: 'user', 
      content: currentInput.trim() 
    }])
    
    setCurrentInput('')
    setIsLoading(true)

    try {
      const llmResponse = await processWithLLM(currentInput.trim())
      setMessages(prev => [...prev, { 
        type: 'bot', 
        content: llmResponse,
        source: 'llm'
      }])
    } catch (error) {
      console.error('Error processing input:', error)
      setMessages(prev => [...prev, { 
        type: 'bot', 
        content: "I apologize, but I encountered an error. Please try again.",
        source: 'llm'
      }])
    }

    setIsLoading(false)
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b">
        <div className="flex items-center gap-4">
          <a href="/" className="text-xl font-semibold text-blue-600">AnswerlyAI</a>
        </div>
        <div className="flex items-center gap-4">
          <a href="/how-it-works" className="text-sm text-gray-600 hover:text-gray-900">How it works</a>
          <a href="/waitlist" className="text-sm text-gray-600 hover:text-gray-900">Waitlist</a>
          <a href="/pre-launch" className="text-sm text-gray-600 hover:text-gray-900">Pre-launch offer</a>
          <a href="/workflow" className="text-sm text-gray-600 hover:text-gray-900">Workflow</a>
        </div>
      </div>

      <div className="flex flex-col flex-1 max-w-4xl mx-auto w-full">
        <div className="flex justify-between items-center py-4 px-6">
          <h1 className="text-xl font-semibold">Chat Assistant</h1>
          <Button
            onClick={() => router.push(`/workflow/${workflowId}`)}
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
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800'
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
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleUserInput()
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
  )
}