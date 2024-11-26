import { useState, useEffect } from 'react'
import { generateBotSnippet } from '@/utils/generateBotSnippet'
import { Button } from '@/components/ui/button'

interface BotSnippetProps {
  workflowId: string
}

export default function BotSnippet({ workflowId }: BotSnippetProps) {
  const [snippet, setSnippet] = useState('')

  useEffect(() => {
    setSnippet(generateBotSnippet(workflowId))
  }, [workflowId])

  const copySnippet = () => {
    navigator.clipboard.writeText(snippet)
    alert('Snippet copied to clipboard!')
  }

  return (
    <div className="mt-4">
      <h3 className="text-lg font-bold mb-2">Embed Your Bot</h3>
      <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
        <code>{snippet}</code>
      </pre>
      <Button onClick={copySnippet} className="mt-2">
        Copy Snippet
      </Button>
    </div>
  )
}

