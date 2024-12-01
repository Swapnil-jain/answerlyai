import { useState } from 'react'
import { Globe, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useSupabase } from '@/lib/supabase/provider'
import { workflowCache } from '@/lib/cache/workflowCache'

interface WebsiteCrawlerProps {
  workflowId: string
  disabled?: boolean
  title?: string
  onSaveWorkflow?: () => Promise<void>
}

export default function WebsiteCrawler({ workflowId, disabled, title, onSaveWorkflow }: WebsiteCrawlerProps) {
  const { supabase } = useSupabase()
  const [isOpen, setIsOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [isCrawling, setIsCrawling] = useState(false)
  const [progress, setProgress] = useState<string>('')
  const [error, setError] = useState<string>('')

  const crawlWebsite = async () => {
    if (!url || !workflowId) return

    try {
      setIsCrawling(true)
      setError('')
      setProgress('Starting crawler...')

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

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
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to crawl website')
      }

      setProgress('Processing website content...')
      const data = await response.json()

      setProgress('Updating chatbot context...')
      // Update the workflow's context with the crawled data
      const { error: updateError } = await supabase
        .from('workflows')
        .update({
          context: data.websiteContent,
          last_crawled: new Date().toISOString(),
          website_url: url
        })
        .eq('id', workflowId)

      if (updateError) throw updateError

      // Update cache
      workflowCache.updateWorkflowContext(workflowId, data.websiteContent)

      if (onSaveWorkflow) {
        await onSaveWorkflow()
      }

      setProgress('Website content successfully added to chatbot context!')
      setTimeout(() => {
        setIsOpen(false)
        setProgress('')
      }, 2000)
    } catch (error) {
      console.error('Error crawling website:', error)
      if (error.name === 'AbortError') {
        setError('Request timed out. Please try again or check the URL.')
      } else {
        setError(error.message || 'Failed to crawl website. Please try again.')
      }
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