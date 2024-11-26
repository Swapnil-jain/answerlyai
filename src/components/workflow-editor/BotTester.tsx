import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Message {
  content: string
  isUser: boolean
}

export default function BotTester() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')

  const simulateResponse = async (userMessage: string) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    return "This is a simulated bot response."
  }

  const handleSend = async () => {
    if (!input.trim()) return

    // Add user message
    setMessages(prev => [...prev, { content: input, isUser: true }])
    setInput('')

    // Get bot response
    const response = await simulateResponse(input)
    setMessages(prev => [...prev, { content: response, isUser: false }])
  }

  return (
    <div className="flex flex-col h-[500px] border rounded-lg">
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-2 p-2 rounded-lg ${
              message.isUser
                ? 'bg-blue-100 ml-auto'
                : 'bg-gray-100'
            } max-w-[80%]`}
          >
            {message.content}
          </div>
        ))}
      </div>
      <div className="p-4 border-t flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type your message..."
        />
        <Button onClick={handleSend}>Send</Button>
      </div>
    </div>
  )
} 