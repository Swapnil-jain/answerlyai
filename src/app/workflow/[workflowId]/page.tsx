'use client'

import { use } from 'react'
import dynamic from 'next/dynamic'

const WorkflowEditor = dynamic(
  () => import('@/components/workflow-editor/WorkflowEditor'),
  { ssr: false }
)

export default function WorkflowPage({ params }: { params: Promise<{ workflowId: string }> }) {
  const resolvedParams = use(params)
  
  return <WorkflowEditor workflowId={resolvedParams.workflowId} />
} 