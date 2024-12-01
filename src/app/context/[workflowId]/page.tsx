'use client'

import ContextManager from '@/components/workflow-editor/ContextManager'
import React from 'react'

interface ContextPageProps {
  params: Promise<{
    workflowId: string
  }>
}

export default function ContextPage({ params }: ContextPageProps) {
  const resolvedParams = React.use(params)
  const { workflowId } = resolvedParams
  
  return <ContextManager workflowId={workflowId} />
} 