'use client'

import BotTester from '@/components/workflow-editor/BotTester'

export default function TestPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Test Your Bot</h1>
      <BotTester />
    </div>
  )
} 