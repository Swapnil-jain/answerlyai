'use client'

import { use } from 'react'
import FAQUpload from '@/components/workflow-editor/FAQUpload'
import Header from '@/components/header'
import AuthGuard from '@/components/auth/AuthGuard'

//faq page for existing workflows. Each workflow has its own faq.
interface FAQPageProps {
  params: Promise<{
    workflowId: string
  }>
}

export default function FAQPage({ params }: FAQPageProps) {
  // Unwrap the params using React.use()
  const { workflowId } = use(params)

  return (
    <AuthGuard>
      <div className="flex flex-col h-screen">
        <Header className="z-50" />
        <div className="flex-1 h-[calc(100vh-64px)]">
          <FAQUpload key={workflowId} workflowId={workflowId} />
        </div>
      </div>
    </AuthGuard>
  )
} 