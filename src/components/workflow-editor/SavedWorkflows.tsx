import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, MessageSquare } from 'lucide-react' // Import icons
import { Button } from '@/components/ui/button'

interface SavedWorkflow {
  id: string
  name: string
  updatedAt: string
}

export default function SavedWorkflows() {
  const [workflows, setWorkflows] = useState<SavedWorkflow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const router = useRouter()

  const loadWorkflows = async () => {
    try {
      const response = await fetch('/api/list-workflows')
      const data = await response.json()
      if (data.success) {
        setWorkflows(data.workflows)
      }
    } catch (error) {
      console.error('Failed to load workflows:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadWorkflows()
  }, [])

  const handleDelete = async (workflowId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this workflow?')) {
      try {
        setIsDeleting(workflowId)
        const response = await fetch(`/api/delete-workflow?id=${workflowId}`, {
          method: 'DELETE',
        })
        const data = await response.json()
        if (data.success) {
          await loadWorkflows() // Refresh the list
        } else {
          throw new Error(data.message)
        }
      } catch (error) {
        console.error('Failed to delete workflow:', error)
        alert('Failed to delete workflow')
      } finally {
        setIsDeleting(null)
      }
    }
  }

  return (
    <div className="border-t bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Saved Workflows</h3>
      {isLoading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : workflows.length === 0 ? (
        <div className="text-sm text-gray-500">No saved workflows</div>
      ) : (
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {workflows.map((workflow) => (
            <div
              key={workflow.id}
              onClick={() => router.push(`/workflow/${workflow.id}`)}
              className="p-2 text-sm rounded-md hover:bg-gray-100 cursor-pointer flex items-center justify-between group"
            >
              <div className="truncate flex-1">
                <span className="font-medium">{workflow.name}</span>
                <span className="text-xs text-gray-500 block">
                  {new Date(workflow.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="opacity-0 group-hover:opacity-100 flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/chat/${workflow.id}`)
                  }}
                  className="h-8 w-8 text-blue-600 hover:text-blue-800"
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => handleDelete(workflow.id, e)}
                  disabled={isDeleting === workflow.id}
                  className="h-8 w-8 text-red-600 hover:text-red-800"
                >
                  {isDeleting === workflow.id ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 