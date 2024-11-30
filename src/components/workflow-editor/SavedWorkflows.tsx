import React from 'react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSupabase } from '@/lib/supabase/provider'
import { workflowCache } from '@/lib/cache/workflowCache'
import { logger } from '@/lib/utils/logger'

interface SavedWorkflow {
  id: string
  name: string
  updated_at: string
}

const SavedWorkflows = React.memo(function SavedWorkflows() {
  const { supabase } = useSupabase()
  const [workflows, setWorkflows] = useState<SavedWorkflow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const router = useRouter()
  const currentWorkflowId = useRef<string | null>(null)

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
          logger.log('info', 'cache', 'Using cached workflow list')
          setWorkflows(cachedWorkflows)
          setIsLoading(false)
          
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
      setIsLoading(false)
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

  // Initial load
  useEffect(() => {
    loadWorkflows()
  }, [])

  const handleWorkflowClick = (workflowId: string) => {
    // Prevent re-navigation to the same workflow
    if (currentWorkflowId.current === workflowId) {
      return
    }
    currentWorkflowId.current = workflowId
    router.push(`/builder/${workflowId}`)
  }

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
        
        // Update local state first
        setWorkflows(current => current.filter(w => w.id !== workflowId))
        
        // Try to update cache, but don't fail if cache is unavailable
        try {
          workflowCache.removeWorkflow(workflowId)
        } catch (cacheError) {
          logger.log('warn', 'cache', 'Failed to update cache after deletion')
        }
      } catch (error) {
        logger.log('error', 'database', 'Failed to delete workflow: ' + error)
        alert('Failed to delete workflow')
        // Reload list to ensure consistency
        loadWorkflows()
      } finally {
        setIsDeleting(null)
      }
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
})

export default SavedWorkflows 