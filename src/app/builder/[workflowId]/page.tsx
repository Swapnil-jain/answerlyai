'use client'

import { use } from 'react'
import WorkflowEditor from '@/components/workflow-editor/WorkflowEditor'

export default function WorkflowPage({ params }: { params: Promise<{ workflowId: string }> }) {
  const resolvedParams = use(params)
  
  return <WorkflowEditor workflowId={resolvedParams.workflowId} />
} 