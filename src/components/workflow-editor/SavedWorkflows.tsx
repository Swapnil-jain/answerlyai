import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, MessageSquare } from 'lucide-react' // Import icons
import { Button } from '@/components/ui/button'
import { useSupabase } from '@/lib/supabase/provider'

interface SavedWorkflow {
  id: string
  name: string
  updated_at: string
}

export default function SavedWorkflows() {
  const { supabase } = useSupabase()
  const [workflows, setWorkflows] = useState<SavedWorkflow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const router = useRouter()

  const loadWorkflows = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setWorkflows([])
        return
      }

      const { data, error } = await supabase
        .from('workflows')
        .select('id, name, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error
      setWorkflows(data || [])
    } catch (error) {
      console.error('Failed to load workflows:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    loadWorkflows()
  }, [])

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('workflows-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workflows'
        },
        () => {
          loadWorkflows()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleDelete = async (workflowId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this workflow?')) {
      try {
        setIsDeleting(workflowId)
        const { error } = await supabase
          .from('workflows')
          .delete()
          .eq('id', workflowId)

        if (error) throw error
        loadWorkflows() // Refresh the list
      } catch (error) {
        console.error('Failed to delete workflow:', error)
        alert('Failed to delete workflow')
      } finally {
        setIsDeleting(null)
      }
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'No date'
      }
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'No date'
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
              onClick={() => router.push(`/builder/${workflow.id}`)}
              className="p-2 text-sm rounded-md hover:bg-gray-100 cursor-pointer flex items-center justify-between group"
            >
              <div className="truncate flex-1">
                <span className="font-medium">{workflow.name}</span>
                <span className="text-xs text-gray-500 block">
                  {formatDate(workflow.updated_at)}
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