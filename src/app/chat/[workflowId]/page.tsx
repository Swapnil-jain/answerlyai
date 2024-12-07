'use client'

//chatbot page accessible from workfloweditor.
import { use } from 'react'
import WorkflowChatbot from '@/components/workflow-chatbot/WorkflowChatbot'

export default function ChatPage({ params }: { params: Promise<{ workflowId: string }> }) {
  const resolvedParams = use(params)

  return <WorkflowChatbot workflowId={resolvedParams.workflowId} />
}