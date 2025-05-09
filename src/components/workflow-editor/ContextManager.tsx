'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/useAuth'
import { workflowCache } from '@/lib/cache/workflowCache'
import { Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { isAdmin } from '@/lib/utils/adminCheck'
import { WarningMessage } from '../ui/warning-message'

interface ContextManagerProps {
  workflowId: string
  onSaveWorkflow?: () => Promise<void>
}

export default function ContextManager({ workflowId, onSaveWorkflow }: ContextManagerProps) {
  const router = useRouter()
  const { supabase, getUser } = useAuth()
  const [context, setContext] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [alertMessage, setAlertMessage] = useState<{ 
    title: string; 
    description: string; 
    type: 'success' | 'error' | 'confirm' | 'info' 
  } | null>(null)
  const [alertOpen, setAlertOpen] = useState(false)

  useEffect(() => {
    if (workflowId) {
      loadContext()
    }
  }, [workflowId])

  const loadContext = async () => {
    try {
      const { data: { user } } = await getUser()
      if (!user) throw new Error('Not authenticated')

      const table = isAdmin(user.id) ? 'sample_workflows' : 'workflows'

      // Try cache first with validation
      const cachedContext = workflowCache.getWorkflowContext(workflowId)
      if (cachedContext !== null) {
        setContext(cachedContext)
        setIsLoading(false)
        
        // Validate cache in background
        validateCache(workflowId, cachedContext, table)
        return
      }

      const { data, error } = await supabase
        .from(table)
        .select('context')
        .eq('id', workflowId)
        .single()

      if (error) {
        
        throw error
      }

      if (data?.context) {
        setContext(data.context)
        workflowCache.updateWorkflowContext(workflowId, data.context)
      }
    } catch (error) {
      
      // Invalidate cache on error
      workflowCache.removeWorkflow(workflowId)
      showAlert('Error', 'Failed to load context', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const saveContext = async () => {
    if (isSaving) return

    try {
      setIsSaving(true)
      const { data: { user } } = await getUser()
      if (!user) throw new Error('Not authenticated')

      const table = isAdmin(user.id) ? 'sample_workflows' : 'workflows'

      const { error } = await supabase
        .from(table)
        .update({ 
          context: context,
          updated_at: new Date().toISOString()
        })
        .eq('id', workflowId)

      if (error) {
        
        throw error
      }

      // Update cache after successful save
      workflowCache.updateWorkflowContext(workflowId, context)
      setHasUnsavedChanges(false)
      showAlert('Success', 'Context saved successfully.', 'success')

      if (onSaveWorkflow) {
        await onSaveWorkflow()
      }

      // Record token usage after successful save
    } catch (error) {
      
      // Invalidate cache on error to ensure consistency
      workflowCache.removeWorkflow(workflowId)
      showAlert('Error', 'Failed to save context', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleContextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContext(e.target.value)
    setHasUnsavedChanges(true)
  }

  const handleBack = () => {
    if (hasUnsavedChanges) {
      showAlert('Unsaved Changes', 'Would you like to save your changes before leaving?', 'confirm')
      return
    }
    router.push(`/builder/${workflowId}`)
  }

  const showAlert = (title: string, description: string, type: 'success' | 'error' | 'confirm') => {
    setAlertMessage({ title, description, type })
    setAlertOpen(true)
  }

  const handleAlertClose = () => {
    const type = alertMessage?.type
    setAlertOpen(false)

    if (type === 'confirm') {
      // Only handle navigation for confirmation dialogs
      if (hasUnsavedChanges) {
        saveContext().then(() => {
          router.push(`/builder/${workflowId}`)
        })
      }
    }
  }

  // Add cache validation function
  const validateCache = async (workflowId: string, cachedContext: string, table: string) => {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('context')
        .eq('id', workflowId)
        .single()

      if (error) throw error

      // If database data differs from cache, update both state and cache
      if (data?.context !== cachedContext) {
        setContext(data.context || '')
        workflowCache.updateWorkflowContext(workflowId, data.context || '')
      }
    } catch (error) {
      
      // On validation error, invalidate cache
      workflowCache.removeWorkflow(workflowId)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1 max-w-6xl mx-auto p-8 pt-20">
      <div className="space-y-4">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Agent Context Management</h2>
            <Button
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              « Back to Workflow Editor
            </Button>
          </div>
          <p className="text-gray-600">
            Add any additional context or instructions that your agent should know about.
          </p>
        </div>

        {/* Warning Message */}
        <WarningMessage title="Optimize Context for Better Performance">
          <div className="space-y-1.5">
            <p className="text-sm font-medium">
              Optimize your context to minimise your daily word limit usage:
            </p>
            <div className="flex gap-6 text-sm">
              <ul className="space-y-1 list-none">
                <li>• Keep content focused and concise</li>
                <li>• Remove redundant information</li>
              </ul>
              <ul className="space-y-1 list-none">
                <li>• Include only essential policies</li>
                <li>• Trim crawled content carefully</li>
              </ul>
            </div>
            <p className="text-xs text-yellow-600 pt-1">
              💡 Pro tip: Organize content into sections (shipping, returns, etc.) for better efficiency
            </p>
          </div>
        </WarningMessage>

        {/* Context Editor Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            <Textarea
              placeholder="Example: Our company's return policy is 30 days..."
              value={context}
              onChange={handleContextChange}
              className="min-h-[300px] bg-white border-gray-200"
            />
            <div className="flex justify-end gap-3">
              <Button
                onClick={saveContext}
                disabled={isSaving}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertMessage?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {alertMessage?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {alertMessage?.type === 'confirm' ? (
              // Show multiple buttons for confirmation dialog
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAlertOpen(false)
                    router.push(`/builder/${workflowId}`)
                  }}
                >
                  Don't Save
                </Button>
                <Button
                  onClick={handleAlertClose}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Save & Exit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setAlertOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              // Show single OK button for success/error alerts
              <AlertDialogAction onClick={() => setAlertOpen(false)}>
                OK
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 