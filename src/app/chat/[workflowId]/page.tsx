'use client'

import { use } from 'react'
import WorkflowChatbot from '@/components/workflow-chatbot/WorkflowChatbot'
import Header from '@/components/header'

export default function ChatPage({ params }: { params: Promise<{ workflowId: string }> }) {
  const resolvedParams = use(params)

  return <WorkflowChatbot workflowId={resolvedParams.workflowId} />
}