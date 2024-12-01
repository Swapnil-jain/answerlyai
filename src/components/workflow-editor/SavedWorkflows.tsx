import React, { useMemo } from 'react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSupabase } from '@/lib/supabase/provider'
import { workflowCache } from '@/lib/cache/workflowCache'
import { logger } from '@/lib/utils/logger'
import { eventEmitter } from '@/lib/utils/events'
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { AlertDialogAction } from '@/components/ui/alert-dialog'

interface SavedWorkflow {
  id: string
  name: string
  updated_at: string
}

// Add this prop interface
interface SavedWorkflowsProps {
  onWorkflowSelect: (workflowId: string) => void
}

const SavedWorkflows = React.memo(function SavedWorkflows({ onWorkflowSelect }: SavedWorkflowsProps) {
  const { supabase } = useSupabase()
  const [workflows, setWorkflows] = useState<SavedWorkflow[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const router = useRouter()
  const currentWorkflowId = useRef<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [workflowToDelete, setWorkflowToDelete] = useState<string | null>(null)
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState<{ title: string; description: string }>({
    title: '',
    description: ''
  })

  const loadWorkflows = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setWorkflows([])
        return
      }

      // Try to get from cache first
      try {
        const cachedWorkflows = workflowCache.getWorkflowList()
        if (cachedWorkflows) {
          setWorkflows(cachedWorkflows)
          setInitialLoading(false)
          
          // Validate cache against database in background
          validateCache(user.id, cachedWorkflows)
          return
        }
      } catch (cacheError) {
        logger.log('warn', 'cache', 'Failed to read cache, falling back to database')
      }

      // Load from database
      await loadFromDatabase(user.id)
    } catch (error) {
      logger.log('error', 'database', 'Failed to load workflows: ' + error)
    } finally {
      setInitialLoading(false)
    }
  }

  // Separate function to load from database
  const loadFromDatabase = async (userId: string) => {
    logger.log('info', 'database', 'Fetching workflow list from database')
    const { data, error } = await supabase
      .from('workflows')
      .select('id, name, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) throw error

    if (data) {
      logger.log('info', 'database', `Retrieved ${data.length} workflows from database`)
      setWorkflows(data)
      // Try to update cache, but don't fail if cache is unavailable
      try {
        workflowCache.setWorkflowList(data)
      } catch (cacheError) {
        logger.log('warn', 'cache', 'Failed to update cache')
      }
    }
  }

  // Validate cache against database in background
  const validateCache = async (userId: string, cachedData: SavedWorkflow[]) => {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('id, name, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (error) throw error

      // Check if cache is stale
      const isStale = JSON.stringify(data) !== JSON.stringify(cachedData)
      
      if (isStale) {
        logger.log('info', 'cache', 'Cache is stale, updating from database')
        setWorkflows(data)
        try {
          workflowCache.setWorkflowList(data)
        } catch (cacheError) {
          logger.log('warn', 'cache', 'Failed to update stale cache')
        }
      }
    } catch (error) {
      logger.log('warn', 'cache', 'Cache validation failed: ' + error)
    }
  }

  // Add this method to update a workflow in the list
  const updateWorkflowInList = (updatedWorkflow: { id: string; name: string; updated_at: string }) => {
    setWorkflows(currentWorkflows => {
      // Create a new array instead of modifying the existing one
      const workflowExists = currentWorkflows.some(w => w.id === updatedWorkflow.id)
      
      let newWorkflows
      if (workflowExists) {
        newWorkflows = currentWorkflows.map(workflow => 
          workflow.id === updatedWorkflow.id ? updatedWorkflow : workflow
        )
      } else {
        newWorkflows = [...currentWorkflows, updatedWorkflow]
      }

      return newWorkflows.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )
    })
  }

  // Update the useEffect to listen for workflow updates with data
  useEffect(() => {
    loadWorkflows()
    
    const unsubscribe = eventEmitter.subscribe('workflowUpdated', (workflow) => {
      console.log('Received workflow update:', workflow)
      if (workflow) {
        updateWorkflowInList(workflow)
      } else {
        console.log('No workflow data received, reloading list')
        loadWorkflows()
      }
    })
    
    return () => {
      unsubscribe()
    }
  }, [loadWorkflows])

  const handleWorkflowClick = (workflowId: string) => {
    // Prevent re-navigation to the same workflow
    if (currentWorkflowId.current === workflowId) {
      return
    }

    // Update the current workflow ID
    currentWorkflowId.current = workflowId
    
    // Call the parent handler instead of using router
    onWorkflowSelect(workflowId)
    
    // Update URL without triggering a reload
    window.history.pushState({}, '', `/builder/${workflowId}`)
  }

  const showAlert = (title: string, description: string) => {
    setAlertMessage({ title, description })
    setAlertOpen(true)
  }

  const handleDelete = async (workflowId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setWorkflowToDelete(workflowId)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!workflowToDelete) return

    try {
      setIsDeleting(workflowToDelete)
      setDeleteConfirmOpen(false) // Close the confirmation dialog immediately

      const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', workflowToDelete)

      if (error) throw error
      
      // Update local state first
      setWorkflows(current => current.filter(w => w.id !== workflowToDelete))
      
      // Try to update cache
      try {
        workflowCache.removeWorkflow(workflowToDelete)
      } catch (cacheError) {
        logger.log('warn', 'cache', 'Failed to update cache after deletion')
      }

      showAlert('Success', 'Workflow deleted successfully')
    } catch (error) {
      logger.log('error', 'database', 'Failed to delete workflow: ' + error)
      showAlert('Error', 'Failed to delete workflow. Please try again.')
      // Reload list to ensure consistency
      loadWorkflows()
    } finally {
      setIsDeleting(null)
      setWorkflowToDelete(null)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'No date'
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'No date'
    }
  }

  // Also, let's memoize the workflow list to prevent unnecessary re-renders
  const workflowList = useMemo(() => (
    <div className="space-y-2 max-h-[200px] overflow-y-auto">
      {workflows.map((workflow) => (
        <div
          key={workflow.id}
          onClick={() => handleWorkflowClick(workflow.id)}
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
              disabled={isDeleting !== null} // Disable all delete buttons while any deletion is in progress
              className={`h-8 w-8 ${
                isDeleting === workflow.id 
                  ? 'text-blue-600' 
                  : 'text-red-600 hover:text-red-800'
              }`}
            >
              {isDeleting === workflow.id ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      ))}
    </div>
  ), [workflows, isDeleting, router, handleDelete])

  return (
    <div className="border-t bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Saved Workflows</h3>
      {initialLoading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : workflows.length === 0 ? (
        <div className="text-sm text-gray-500">No saved workflows</div>
      ) : workflowList}

      {/* Add Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this workflow? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false)
                setWorkflowToDelete(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Alert Dialog */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertMessage.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {alertMessage.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAlertOpen(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}, (prevProps, nextProps) => {
  // Implement comparison if needed
  return true
})

export default SavedWorkflows 