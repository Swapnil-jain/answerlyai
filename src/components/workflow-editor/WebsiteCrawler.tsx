import { useState } from 'react'
import { Globe, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { workflowCache } from '@/lib/cache/workflowCache'
import { isAdmin } from '@/lib/utils/adminCheck'

interface WebsiteCrawlerProps {
  workflowId: string
  disabled?: boolean
  title?: string
  onSaveWorkflow?: () => Promise<boolean>
}

export default function WebsiteCrawler({ workflowId, disabled, title, onSaveWorkflow }: WebsiteCrawlerProps) {
  const { supabase, getUser } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [isCrawling, setIsCrawling] = useState(false)
  const [progress, setProgress] = useState<string>('')
  const [error, setError] = useState<string>('')

  const crawlWebsite = async () => {
    if (!url || !workflowId) return

    try {
      const { data: { user } } = await getUser()
      if (!user) throw new Error('Not authenticated')

      const table = isAdmin(user.id) ? 'sample_workflows' : 'workflows'

      setIsCrawling(true)
      setError('')
      setProgress('Starting crawler...')

      const { data: workflowCheck, error: workflowError } = await supabase
        .from(table)
        .select('id')
        .eq('id', workflowId)
        .single()

      if (workflowError) {
        console.error('Workflow access check error:', workflowError)
        throw new Error('Unable to access workflow')
      }

      const { data: existingData, error: contextError } = await supabase
        .from(table)
        .select('context')
        .eq('id', workflowId)
        .single()

      if (contextError) {
        console.error('Context fetch error:', contextError)
        throw contextError
      }

      const existingContext = existingData?.context || ''

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const response = await fetch('/api/crawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          workflowId,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to crawl website')
      }

      setProgress('Processing website content...')
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'Failed to crawl website')
      }

      setProgress('Updating chatbot context...')
      
      const combinedContext = existingContext
        ? `${existingContext}\n\nWebsite Content from ${url}:\n${data.websiteContent}`
        : data.websiteContent

      const updateData = {
        context: combinedContext,
        updated_at: new Date().toISOString()
      }

      if (table === 'workflows') {
        Object.assign(updateData, {
          last_crawled: new Date().toISOString(),
          website_url: url
        })
      }

      console.log('Updating context with:', { table, workflowId, updateData })

      const { data: result, error: updateError } = await supabase
        .from(table)
        .update(updateData)
        .eq('id', workflowId)
        .select()

      if (updateError) {
        console.error('Context update error:', {
          error: updateError,
          details: {
            table,
            workflowId,
            userId: user.id,
            isAdmin: isAdmin(user.id),
            updateData
          }
        })
        throw new Error(`Failed to update context: ${updateError.message}`)
      }

      if (!result) {
        throw new Error('No data returned from update')
      }

      workflowCache.updateWorkflowContext(workflowId, combinedContext)

      if (onSaveWorkflow) {
        await onSaveWorkflow()
      }

      setProgress('Website content successfully added to chatbot context!')
      setTimeout(() => {
        setIsOpen(false)
        setProgress('')
      }, 2000)
    } catch (error: unknown) {
      console.error('Crawl error:', {
        error,
        details: {
          url,
          workflowId,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      })
      setError(error instanceof Error ? error.message : 'Failed to crawl website')
      setProgress('')
    } finally {
      setIsCrawling(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white"
          size="sm"
          disabled={disabled}
          title={title}
        >
          <Sparkles className="h-4 w-4" />
          {disabled ? "Save First to Import Content" : "Import Website Content"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle>Import Website Content</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Enter your website URL to import its content into the chatbot context.
              This process may take a few moments.
            </p>
            <Input
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full"
            />
          </div>
          {progress && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p>{progress}</p>
            </div>
          )}
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOpen(false)
                setError('')
                setProgress('')
              }}
              className="bg-white hover:bg-gray-50"
              disabled={isCrawling}
            >
              Cancel
            </Button>
            <Button 
              onClick={crawlWebsite}
              disabled={isCrawling || !url}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              {isCrawling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Globe className="mr-2 h-4 w-4" />
                  Import Content
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 