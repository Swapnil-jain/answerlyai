import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PlusCircle, MessageSquare, Settings, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useSupabase } from '@/lib/supabase/provider'
import { workflowCache } from '@/lib/cache/workflowCache'
import WebsiteCrawler from './WebsiteCrawler'

interface SidebarProps {
  className?: string
  workflowId?: string
  onNewWorkflow: () => void
  isCreating?: boolean
  onSaveWorkflow?: () => Promise<boolean>
  onChatbotClick: () => void
  onWidgetClick: () => void
  onFAQClick: () => void
  onContextClick: () => void
}

export default function Sidebar({ className = '', workflowId, onNewWorkflow, isCreating, onSaveWorkflow, onChatbotClick, onWidgetClick, onFAQClick, onContextClick }: SidebarProps) {
  const router = useRouter()
  const { supabase } = useSupabase()
  
  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }

  const handleNewWorkflow = () => {
    router.push('/builder')
  }

  const handleFAQClick = () => {
    if (!workflowId) {
      console.error('No workflow ID available')
      return
    }
    router.push(`/faq/${workflowId}`)
  }

  const handleContextClick = () => {
    if (!workflowId) {
      console.error('No workflow ID available')
      return
    }
    router.push(`/context/${workflowId}`)
  }

  // Create a wrapper function that preserves the boolean return value
  const handleSaveWorkflow = onSaveWorkflow 
    ? async () => {
        const result = await onSaveWorkflow()
        return result  // Return the boolean result
      }
    : undefined

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex-none p-4 border-b bg-white">
        <div className="flex flex-col items-center space-y-2">
          <span 
            className="text-2xl font-bold text-blue-600 cursor-pointer hover:text-blue-700"
            onClick={() => router.push('/')}
          >
            AnswerlyAI
          </span>
          <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
            <Sparkles className="w-3 h-3 text-blue-600" />
            <span className="text-xs font-medium text-blue-600">Only.Relevant.Features.</span>
          </div>
        </div>
      </div>

      <div className="flex-none p-4 border-b bg-white space-y-2">
        <Button 
          onClick={onNewWorkflow}
          className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white"
          size="sm"
          disabled={isCreating}
        >
          {isCreating ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Creating...
            </>
          ) : (
            <>
              <PlusCircle className="h-4 w-4" />
              New Workflow
            </>
          )}
        </Button>
        <Button
          onClick={onFAQClick}
          variant="ghost"
          size="sm"
          className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white"
          disabled={!workflowId}
          title={!workflowId ? "Save your workflow first to manage FAQs" : ""}
        >
          <MessageSquare className="h-4 w-4" />
          {!workflowId ? "Save First to Manage FAQs" : "Manage FAQs"}
        </Button>
        <Button 
          onClick={onContextClick}
          className="w-full flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white"
          size="sm"
          disabled={!workflowId}
          title={!workflowId ? "Save your workflow first to set context" : ""}
        >
          <Settings className="h-4 w-4" />
          {!workflowId ? "Save First to Set Context" : "Chatbot Context"}
        </Button>
        <WebsiteCrawler 
          workflowId={workflowId || ''}
          disabled={!workflowId}
          title={!workflowId ? "Save your workflow first to import content" : ""}
          onSaveWorkflow={handleSaveWorkflow}
        />
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Node Types</h2>
          <div className="space-y-2">
            <div
              className="p-2 border rounded-md bg-yellow-50 cursor-move hover:bg-yellow-100"
              onDragStart={(e) => onDragStart(e, 'scenario')}
              draggable
            >
              Scenario Node
            </div>
            <div
              className="p-2 border rounded-md bg-blue-50 cursor-move hover:bg-blue-100"
              onDragStart={(e) => onDragStart(e, 'decision')}
              draggable
            >
              Decision Node
            </div>
            <div
              className="p-2 border rounded-md bg-green-50 cursor-move hover:bg-green-100"
              onDragStart={(e) => onDragStart(e, 'action')}
              draggable
            >
              Action Node
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

