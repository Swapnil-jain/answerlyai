import { useState, useEffect } from 'react'
import { Globe, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/hooks/useAuth'
import { isAdmin } from '@/lib/utils/adminCheck'

interface DiscoveredUrl {
  url: string
  selected: boolean
  title?: string
  alreadyCrawled?: boolean
}

interface CrawlResult {
  url: string;
  error?: string;
  title?: string;
  content?: string;
}

interface WebsiteCrawlerProps {
  workflowId: string
  disabled?: boolean
  title?: string
  onSaveWorkflow?: () => Promise<boolean | void>
}

export default function WebsiteCrawler({ workflowId, disabled, title, onSaveWorkflow }: WebsiteCrawlerProps) {
  const { supabase, getUser } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [normalizedUrl, setNormalizedUrl] = useState('')
  const [isCrawling, setIsCrawling] = useState(false)
  const [progress, setProgress] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [discoveredUrls, setDiscoveredUrls] = useState<DiscoveredUrl[]>([])
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [step, setStep] = useState<'input' | 'select' | 'crawling'>('input')
  const MAX_URLS = 15

  const normalizeUrl = (inputUrl: string): string => {
    try {
      new URL(inputUrl)
      return inputUrl
    } catch {
      try {
        const urlWithHttps = `https://${inputUrl}`
        new URL(urlWithHttps)
        return urlWithHttps
      } catch {
        return ''
      }
    }
  }

  const discoverUrls = async () => {
    if (!url) return

    try {
      const { data: { user } } = await getUser()
      if (!user) throw new Error('Not authenticated')

      // Get workflow data
      const { data: workflowData, error: workflowError } = await supabase
        .from(isAdmin(user.id) ? 'sample_workflows' : 'workflows')
        .select('context, website_url')
        .eq('id', workflowId)
        .single()

      if (workflowError) {
        
        throw new Error('Failed to fetch workflow data')
      }

      if (!workflowData) {
        throw new Error('Workflow not found')
      }

      const normalized = normalizeUrl(url)
      if (!normalized) {
        throw new Error('Invalid URL format. Please enter a valid URL')
      }
      setNormalizedUrl(normalized)

      setIsDiscovering(true)
      setError('')
      setProgress('Discovering pages...')

      const response = await fetch('/api/discover-urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: normalized }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to discover pages')
      }

      const data = await response.json()
      
      const discoveredUrlsWithStatus = data.urls.map((url: string) => {
        const pageMarker = `[Page: ${url}]`
        const isAlreadyCrawled = workflowData.context?.includes(pageMarker) ?? false
        return {
          url,
          selected: false,
          title: url,
          alreadyCrawled: isAlreadyCrawled
        }
      })
      setDiscoveredUrls(discoveredUrlsWithStatus)
      setStep('select')
      setProgress('')
    } catch (error) {
      
      setError(error instanceof Error ? error.message : 'Failed to discover pages')
    } finally {
      setIsDiscovering(false)
      setProgress('')
    }
  }

  const toggleUrlSelection = (url: string) => {
    setDiscoveredUrls(prev => {
      const selectedCount = prev.filter(item => item.selected).length
      const urlItem = prev.find(item => item.url === url)
      
      if (!urlItem?.selected && selectedCount >= MAX_URLS) {
        setError(`You can only select up to ${MAX_URLS} URLs at once`)
        return prev
      }
      
      setError('')
      return prev.map(item => 
        item.url === url ? { ...item, selected: !item.selected } : item
      )
    })
  }

  const crawlWebsite = async () => {
    if (!url || !workflowId) return

    try {
      const normalized = normalizeUrl(url)
      if (!normalized) {
        throw new Error('Invalid URL format. Please enter a valid URL')
      }

      const { data: { user } } = await getUser()
      if (!user) throw new Error('Not authenticated')

      const table = isAdmin(user.id) ? 'sample_workflows' : 'workflows'

      setIsCrawling(true)
      setError('')
      setProgress('Crawling in progress... This might take a few minutes')
      setStep('crawling')

      const { data: workflowCheck, error: workflowError } = await supabase
        .from(table)
        .select('id')
        .eq('id', workflowId)
        .single()

      if (workflowError) {
        
        
        throw new Error('Unable to access workflow')
      }

      const { data: existingData, error: contextError } = await supabase
        .from(table)
        .select('context')
        .eq('id', workflowId)
        .single()

      if (contextError) {
        
        
        throw contextError
      }

      const existingContext = existingData?.context || ''
      const selectedUrls = discoveredUrls.filter(item => item.selected).map(item => item.url)

      if (selectedUrls.length === 0) {
        setError('No pages selected to crawl')
        setIsCrawling(false)
        return
      }
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 180000)

      const response = await fetch('/api/crawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          urls: selectedUrls,
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

      // Format the crawled content
      const websiteContent = data.results
        .map((result: CrawlResult) => {
          if (result.error) {
            return `[Error crawling ${result.url}: ${result.error}]\n\n`
          }
          return `[Page: ${result.url}]\nTitle: ${result.title}\nContent: ${result.content}\n\n`
        })
        .join('')
        .replace(/\s{3,}/g, '\n\n') // Replace multiple whitespace with double newlines
        .trim()

      const combinedContext = existingContext
        ? `${existingContext.trim()}\n\nWebsite Content from ${normalized} and related pages:\n${websiteContent}`
        : websiteContent

      const updateData = {
        context: combinedContext,
        updated_at: new Date().toISOString()
      }

      if (table === 'workflows') {
        Object.assign(updateData, {
          last_crawled: new Date().toISOString(),
          website_url: normalized
        })
      }

      const { error: updateError } = await supabase
        .from(table)
        .update(updateData)
        .eq('id', workflowId)

      if (updateError) {
        throw updateError
      }

      // Close dialog immediately and update workflow
      setIsOpen(false)
      setProgress('')
      setIsCrawling(false)
      setStep('input')
      setUrl('')
      setDiscoveredUrls([])
      setError('')

      // Wait a tick before calling onSaveWorkflow to ensure state updates are processed
      await new Promise(resolve => setTimeout(resolve, 0))
      
      if (onSaveWorkflow) {
        try {
          await onSaveWorkflow()
        } catch (error) {
          
        }
      }
    } catch (error) {
      
      setError(error instanceof Error ? error.message : 'Failed to crawl website')
      setIsCrawling(false)
      setProgress('')
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
          {isCrawling ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Starting website crawler...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {disabled ? "Save First to Import Content" : "Import Website Content"}
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl min-w-[600px]">
        <DialogHeader>
          <DialogTitle>Crawl Website</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter website URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isCrawling || isDiscovering || step !== 'input'}
              className="flex-1"
            />
            {step === 'input' && (
              <Button
                variant="outline"
                onClick={discoverUrls}
                disabled={!url || isCrawling || isDiscovering}
                className="whitespace-nowrap"
              >
                {isDiscovering ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Discovering
                  </>
                ) : (
                  <>
                    <Globe className="mr-2 h-4 w-4" />
                    Discover Pages
                  </>
                )}
              </Button>
            )}
          </div>

          {discoveredUrls.length > 0 && step === 'select' && (
            <div className="space-y-2 max-h-[300px] overflow-y-auto border rounded-md p-4">
              <div className="font-medium flex justify-between items-center">
                <span>Discovered Pages:</span>
                <span className="text-sm text-muted-foreground">
                  Selected: {discoveredUrls.filter(url => url.selected).length}/{MAX_URLS}
                </span>
              </div>
              {discoveredUrls.map((item, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <Checkbox
                    checked={item.selected}
                    onCheckedChange={() => toggleUrlSelection(item.url)}
                    disabled={isCrawling}
                    className="mt-1"
                  />
                  <span className={`text-sm break-all ${item.alreadyCrawled ? 'text-orange-500' : ''}`}>
                    {item.url}
                    {item.alreadyCrawled && (
                      <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                        Previously crawled
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}

          {error && <div className="text-red-500 text-sm">{error}</div>}
          {progress && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {progress}
            </div>
          )}

          <div className="flex justify-end gap-2">
            {step === 'select' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep('input')
                    setDiscoveredUrls([])
                    setError('')
                  }}
                  disabled={isCrawling}
                >
                  Back
                </Button>
                <Button
                  onClick={crawlWebsite}
                  disabled={isCrawling || !discoveredUrls.some(url => url.selected)}
                >
                  {isCrawling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Crawling...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Start Crawling
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}