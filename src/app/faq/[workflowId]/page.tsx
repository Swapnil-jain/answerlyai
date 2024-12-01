'use client'

import FAQUpload from '@/components/workflow-editor/FAQUpload'
import React from 'react'

interface FAQPageProps {
  params: Promise<{
    workflowId: string
  }>
}

export default function FAQPage({ params }: FAQPageProps) {
  const resolvedParams = React.use(params)
  const { workflowId } = resolvedParams
  
  return <FAQUpload workflowId={workflowId} />
} 