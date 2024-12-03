'use client'

import FAQUpload from '@/components/workflow-editor/FAQUpload'
import Header from '@/components/header'
import React from 'react'

interface FAQPageProps {
  params: Promise<{
    workflowId: string
  }>
}

export default function FAQPage({ params }: FAQPageProps) {
  const resolvedParams = React.use(params)
  const { workflowId } = resolvedParams
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 pt-16">
        <div className="container mx-auto px-6">
          <FAQUpload workflowId={workflowId} />
        </div>
      </div>
    </div>
  )
} 