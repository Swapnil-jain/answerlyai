'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Save, Trash2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { workflowCache } from '@/lib/cache/workflowCache'

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { RateLimiter } from '@/lib/utils/rateLimiter'
import { estimateTokens } from '@/lib/utils/tokenEstimator'
import { isAdmin } from '@/lib/utils/adminCheck'

interface FAQ {
  id: string
  question: string
  answer: string
  user_id: string
  workflow_id: string
  created_at: string
  updated_at: string
}

interface FAQUploadProps {
  workflowId: string;
  onSaveWorkflow?: () => Promise<void>
}

// Add this custom styled input component
const FileInput = ({ onChange }: { onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
  <div className="relative">
    <input
      type="file"
      accept=".csv"
      onChange={onChange}
      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
    />
    <div className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-md px-4 py-2 text-sm font-medium flex items-center gap-2">
      <Plus className="w-4 h-4" />
      Choose CSV File
    </div>
  </div>
)

export default function FAQUpload({ workflowId, onSaveWorkflow }: FAQUploadProps) {
  const { supabase, getUser } = useAuth()
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const [alertMessage, setAlertMessage] = useState<{ title: string; description: string } | null>(null)
  const [alertOpen, setAlertOpen] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false)
  const [deletedFaqs, setDeletedFaqs] = useState<FAQ[]>([])
  const [faqToDelete, setFaqToDelete] = useState<FAQ | null>(null);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);

  // Move the initial fetch to useEffect instead of calling directly
  useEffect(() => {
    if (workflowId) {
      fetchFAQs()
    }
  }, [workflowId]) // Add workflowId as dependency

  const fetchFAQs = async () => {
    try {
      const { data: { user } } = await getUser()
      if (!user) throw new Error('Not authenticated')

      // Choose appropriate table based on admin status
      const table = isAdmin(user.id) ? 'sample_faqs' : 'faqs'

      // Try to get from cache first
      const cachedFAQs = workflowCache.getFAQs(workflowId)
      if (cachedFAQs) {
        setFaqs(cachedFAQs)
        setIsLoading(false)
        return
      }

      // Load from database if not in cache
      
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('workflow_id', workflowId)
        .order('created_at', { ascending: true })

      if (error) throw error
      
      // Update state and cache
      if (data) {
        
        setFaqs(data)
        workflowCache.setFAQs(workflowId, data)
      }
    } catch (error) {
      
      setAlertMessage({
        title: 'Error Loading FAQs',
        description: 'Failed to load FAQs. Please try again.'
      })
      setAlertOpen(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        const rows = text.split('\n')

        const parsedFaqs = rows.slice(1).map(row => {
          const [question, answer] = row.split(',')
          return {
            id: crypto.randomUUID(),
            question,
            answer,
            user_id: '',  // Will be set during save
            workflow_id: workflowId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        })

        setFaqs([...faqs, ...parsedFaqs])
        setHasUnsavedChanges(true)
      }
      reader.readAsText(file)
    }
  }

  const addNewFAQ = async () => {
    try {
      const { data: { user } } = await getUser()
      if (!user) throw new Error('Not authenticated')

      const now = new Date().toISOString()
      setFaqs([...faqs, { 
        id: crypto.randomUUID(), 
        question: '', 
        answer: '',
        user_id: user.id,
        workflow_id: workflowId,
        created_at: now,
        updated_at: now
      }])
    } catch (error) {
      
      setAlertMessage({
        title: 'Error',
        description: 'Failed to add new FAQ. Please try again.'
      })
      setAlertOpen(true)
    }
  }

  const handleDeleteClick = (faq: FAQ) => {
    setFaqToDelete(faq);
    setDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!faqToDelete) return;
    try {
      const table = isAdmin(faqToDelete.user_id) ? 'sample_faqs' : 'faqs'
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', faqToDelete.id)

      if (error) throw error
    } catch (error) {
      
      setAlertMessage({
        title: 'Error Deleting FAQ',
        description: 'Failed to delete FAQ. Please try again.'
      })
      setAlertOpen(true)
    } finally {
      setFaqs(currentFaqs => {
        const updatedFaqs = currentFaqs.filter(faq => faq.id !== faqToDelete.id);
        workflowCache.setFAQs(workflowId, updatedFaqs);
        return updatedFaqs;
      });
      setDeletedFaqs([...deletedFaqs, faqToDelete]);
      setHasUnsavedChanges(true);
      setDeleteAlertOpen(false);
      setFaqToDelete(null);
    }
  };

  const handleFAQChange = (id: string, field: 'question' | 'answer', value: string) => {
    const newFaqs = [...faqs]
    const index = newFaqs.findIndex(f => f.id === id)
    if (index !== -1) {
      newFaqs[index][field] = value
      setFaqs(newFaqs)
      setHasUnsavedChanges(true)
    }
  }

  const saveFAQs = async () => {
    try {
      setIsSaving(true)
      const { data: { user } } = await getUser()
      if (!user) throw new Error('Not authenticated')

      const isAdminUser = isAdmin(user.id)
      const table = isAdminUser ? 'sample_faqs' : 'faqs'

      // Prepare FAQs for saving
      const validFaqs = faqs
        .filter(faq => faq.question.trim() !== '' && faq.answer.trim() !== '')
        .map(faq => {
          const now = new Date().toISOString()
          return {
            id: faq.id,
            question: faq.question.trim(),
            answer: faq.answer.trim(),
            workflow_id: workflowId,
            created_at: faq.created_at || now,
            updated_at: now,
            ...(isAdminUser ? {} : { user_id: user.id })
          }
        })

      // Only check rate limits for non-admin users
      const totalTokens = validFaqs.reduce((acc, faq) => 
        acc + estimateTokens.faq(faq.question, faq.answer), 0)
      if (!isAdminUser) {
        // Check rate limit
        const rateLimitCheck = await RateLimiter.checkRateLimit(
          user.id,
          'training',
          totalTokens
        )

        if (!rateLimitCheck.allowed) {
          setAlertMessage({
            title: 'Rate Limit Exceeded',
            description: rateLimitCheck.reason || 'Rate limit exceeded'
          })
          setAlertOpen(true)
          return
        }
      }

      // Batch operations
      const BATCH_SIZE = 50
      const results: FAQ[] = []
      const batchKey = Date.now().toString()

      for (let i = 0; i < validFaqs.length; i += BATCH_SIZE) {
        const batch = validFaqs.slice(i, i + BATCH_SIZE)
        const { data, error } = await supabase
          .from(table)
          .upsert(batch)
          .select()

        if (error) {
          
          throw error
        }

        if (data) {
          results.push(...data)
          // Cache each batch with a unique key
          workflowCache.setFAQs(workflowId, data, { batchKey: `${batchKey}_${i}` })
        }
      }

      // Delete FAQs in batches
      for (let i = 0; i < deletedFaqs.length; i += BATCH_SIZE) {
        const batch = deletedFaqs.slice(i, i + BATCH_SIZE)
        const ids = batch.map(faq => faq.id)
        
        const { error } = await supabase
          .from(table)
          .delete()
          .in('id', ids)

        if (error) {
          
          throw error
        }
      }

      // Update final state
      if (results.length > 0) {
        workflowCache.setFAQs(workflowId, results)
        setFaqs(results)
        setHasUnsavedChanges(false)
        setDeletedFaqs([])
        
        setAlertMessage({
          title: 'Success',
          description: `Successfully saved ${results.length} FAQs!`
        })
        setAlertOpen(true)

        if (onSaveWorkflow) {
          await onSaveWorkflow()
        }

        // Record token usage after successful save
        await RateLimiter.recordTokenUsage(user.id, 'training', totalTokens)
      }

    } catch (error) {
      
      setAlertMessage({
        title: 'Error Saving FAQs',
        description: error instanceof Error ? error.message : 'Failed to save FAQs. Please try again.'
      })
      setAlertOpen(true)
    } finally {
      setIsSaving(false)
    }
  };

  const handleBackClick = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedAlert(true)
    } else {
      router.push(`/builder/${workflowId}`)
    }
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      <div className="flex-1 max-w-6xl mx-auto p-8 pt-20">
        <div className="space-y-8">
          {/* Description Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">FAQ Management for Workflow</h2>
              <Button
                onClick={handleBackClick}
                className="flex items-center gap-2"
              >
                « Back to Workflow Editor
              </Button>
            </div>
            <p className="text-gray-600 mb-4">
              Add FAQs to your chatbot either by uploading a CSV file or manually entering them below. 
              These FAQs will be used to enhance your chatbot's responses with custom knowledge.
            </p>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-2">Example CSV format:</h3>
              <code className="block text-sm text-gray-600">
                question,answer<br/>
                What are your business hours?,We are open Monday to Friday, 9 AM to 5 PM<br/>
                How do I reset my password?,Click on the "Forgot Password" link on the login page
              </code>
            </div>
          </div>

          {/* Upload and Manual Entry Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Manage FAQs</h2>
              <div className="flex gap-3">
                <FileInput onChange={handleFileUpload} />
                <Button
                  onClick={addNewFAQ}
                  className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white"
                >
                  <Plus className="w-4 h-4" /> Add FAQ
                </Button>
                <Button
                  onClick={saveFAQs}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save All'}
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Answer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {faqs.map((faq) => (
                    <tr key={faq.id}>
                      <td className="px-6 py-4">
                        <Input
                          className="w-full"
                          value={faq.question}
                          onChange={(e) => handleFAQChange(faq.id, 'question', e.target.value)}
                          placeholder="Enter question..."
                        />
                      </td>
                      <td className="px-6 py-4">
                        <Input
                          className="w-full"
                          value={faq.answer}
                          onChange={(e) => handleFAQChange(faq.id, 'answer', e.target.value)}
                          placeholder="Enter answer..."
                        />
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(faq)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Dialogs */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertMessage?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {alertMessage?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAlertOpen(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={showUnsavedAlert} onOpenChange={setShowUnsavedAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved FAQs. Would you like to save your changes before leaving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowUnsavedAlert(false)
                router.push(`/builder/${workflowId}`)
              }}
            >
              Discard Changes
            </Button>
            <Button
              onClick={async () => {
                await saveFAQs()
                router.push(`/builder/${workflowId}`)
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Save & Exit
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this FAQ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="secondary" onClick={() => setDeleteAlertOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Confirm
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}