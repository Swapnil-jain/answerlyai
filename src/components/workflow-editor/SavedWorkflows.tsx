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
import { isAdmin } from '@/lib/utils/adminCheck'

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
  const [alertMessage, setAlertMessage] = useState<{ 
    title: string; 
    description: string;
    onClose?: () => void;
  } | null>(null)

  const loadWorkflows = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setWorkflows([])
        workflowCache.clearCache()
        return
      }

      const isAdminUser = isAdmin(user.id)
      const table = isAdminUser ? 'sample_workflows' : 'workflows'

      // Try cache first
      try {
        const cachedWorkflows = workflowCache.getWorkflowList()
        if (cachedWorkflows) {
          setWorkflows(cachedWorkflows)
          setInitialLoading(false)
          
          // Validate cache against database in background
          validateCache(user.id, cachedWorkflows, table, isAdminUser)
          return
        }
      } catch (cacheError) {
        logger.log('warn', 'cache', 'Failed to read cache, falling back to database')
      }

      // Load from database
      logger.log('info', 'database', 'Fetching workflow list from database')
      const query = supabase
        .from(table)
        .select('id, name, updated_at')
        .order('updated_at', { ascending: false })

      // Only filter by user_id for non-admin users
      if (!isAdminUser) {
        query.eq('user_id', user.id)
      }

      const { data, error } = await query

      if (error) throw error

      if (data) {
        logger.log('info', 'database', `Retrieved ${data.length} workflows from database`)
        setWorkflows(data)
        workflowCache.setWorkflowList(data)
      }
    } catch (error) {
      logger.log('error', 'database', 'Failed to load workflows: ' + error)
      workflowCache.clearCache()
    } finally {
      setInitialLoading(false)
    }
  }

  // Update validateCache to handle admin mode correctly
  const validateCache = async (
    userId: string, 
    cachedData: SavedWorkflow[], 
    table: string,
    isAdminUser: boolean
  ) => {
    try {
      const query = supabase
        .from(table)
        .select('id, name, updated_at')
        .order('updated_at', { ascending: false })

      // Only filter by user_id for non-admin users
      if (!isAdminUser) {
        query.eq('user_id', userId)
      }

      const { data, error } = await query

      if (error) throw error

      // Check if cache is stale
      const isStale = JSON.stringify(data) !== JSON.stringify(cachedData)
      
      if (isStale) {
        logger.log('info', 'cache', 'Cache is stale, updating from database')
        setWorkflows(data)
        workflowCache.setWorkflowList(data)
      }
    } catch (error) {
      logger.log('warn', 'cache', 'Cache validation failed: ' + error)
      workflowCache.clearCache()
    }
  }

  // Update updateWorkflowInList to handle admin mode
  const updateWorkflowInList = (updatedWorkflow: SavedWorkflow) => {
    setWorkflows(currentWorkflows => {
      const workflowExists = currentWorkflows.some(w => w.id === updatedWorkflow.id)
      
      let newWorkflows
      if (workflowExists) {
        newWorkflows = currentWorkflows.map(workflow => 
          workflow.id === updatedWorkflow.id ? updatedWorkflow : workflow
        )
      } else {
        newWorkflows = [...currentWorkflows, updatedWorkflow]
      }

      // Sort by updated_at
      const sortedWorkflows = newWorkflows.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )

      // Update cache with new list
      workflowCache.setWorkflowList(sortedWorkflows)
      return sortedWorkflows
    })
  }

  // Update useEffect to handle cache invalidation on unmount
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
  }, [])

  const handleWorkflowClick = (workflowId: string) => {
    // Call the parent handler
    onWorkflowSelect(workflowId)
  }

  const showAlert = (title: string, description: string, onClose?: () => void) => {
    setAlertMessage({ title, description, onClose })
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
      setDeleteConfirmOpen(false)

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

      showAlert('Success', 'Workflow deleted successfully.')
      
      // Navigate to /builder after alert is closed
      const handleAlertClose = () => {
        router.push('/builder')
      }
      
      // Update the alert state to include the close handler
      setAlertMessage({ 
        title: 'Success', 
        description: 'Workflow deleted successfully.',
        onClose: handleAlertClose 
      })

    } catch (error) {
      logger.log('error', 'database', 'Failed to delete workflow: ' + error)
      showAlert('Error', 'Failed to delete workflow. Please try again.')
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
              size="sm"
              onClick={(e) => handleDelete(workflow.id, e)}
              disabled={isDeleting === workflow.id}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {isDeleting === workflow.id ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
              ) : (
                <Trash2 className="h-4 w-4 text-red-500" />
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
              disabled={!!isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={!!isDeleting}
            >
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Deleting...
                </div>
              ) : (
                'Delete'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Alert Dialog */}
      <AlertDialog 
        open={alertOpen} 
        onOpenChange={(open) => {
          setAlertOpen(open)
          if (!open && alertMessage?.onClose) {
            alertMessage.onClose()
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertMessage?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {alertMessage?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => {
              setAlertOpen(false)  // Close the dialog
              if (alertMessage?.onClose) {
                alertMessage.onClose()  // Execute the onClose handler
              }
            }}>
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