import { useRouter } from 'next/navigation'
import { PlusCircle, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  className?: string
  workflowId: string
}

export default function Sidebar({ className = '', workflowId }: SidebarProps) {
  const router = useRouter()
  
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

  return (
    <div className={`flex flex-col h-full ${className} pt-20`}>
      <div className="flex-none p-4 border-b bg-white space-y-2">
        <Button 
          onClick={handleNewWorkflow}
          className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white"
          size="sm"
        >
          <PlusCircle className="h-4 w-4" />
          New Workflow
        </Button>
        <Button 
          onClick={handleFAQClick}
          className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white"
          size="sm"
          disabled={!workflowId}
        >
          <MessageSquare className="h-4 w-4" />
          Manage FAQs
        </Button>
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

