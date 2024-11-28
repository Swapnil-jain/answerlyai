import { useRouter } from 'next/navigation'
import { PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import SavedWorkflows from './SavedWorkflows'

interface SidebarProps {
  className?: string
}

export default function Sidebar({ className = '' }: SidebarProps) {
  const router = useRouter()
  
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }

  const handleNewWorkflow = () => {
    router.push('/builder')
  }

  return (
    <div className={`flex flex-col h-full ${className} pt-20`}>
      <div className="flex-none p-4 border-b bg-white">
        <Button 
          onClick={handleNewWorkflow}
          className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white"
          size="sm"
        >
          <PlusCircle className="h-4 w-4" />
          New Workflow
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Node Types</h2>
          <div className="space-y-2">
            <div
              className="p-2 border rounded-md bg-gray-50 cursor-move hover:bg-gray-100"
              onDragStart={(e) => onDragStart(e, 'start')}
              draggable
            >
              Start Node
            </div>
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

      <div className="flex-none border-t">
        <SavedWorkflows />
      </div>
    </div>
  )
}

