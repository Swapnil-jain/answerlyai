import { logger } from '@/lib/utils/logger'

interface CachedWorkflow {
  id: string
  name: string
  nodes: any[]
  edges: any[]
  updated_at: string
  user_id: string
  context: string
}

interface WorkflowListItem {
  id: string
  name: string
  updated_at: string
}

interface CacheMetadata {
  timestamp: number
  size: number
}

interface FAQ {
  id: string
  question: string
  answer: string
  user_id: string
  workflow_id: string
  created_at: string
  updated_at: string
}

interface DashboardStats {
  activeChatbots: number
  totalChats: number
  averageResponseTime: number
  responseRate: number
  pricingTier: string
  workflowLimit: number
  timestamp: number
}

const CACHE_PREFIX = 'workflow_'
const LIST_CACHE_KEY = 'workflow_list'
const METADATA_KEY = 'workflow_metadata_'
const CACHE_DURATION = 1000 * 60 * 30 // 30 minutes
const MAX_CACHE_SIZE = 4 * 1024 * 1024 // 4MB limit (leaving room for other localStorage usage)
const FAQ_CACHE_PREFIX = 'faq_'
const DASHBOARD_CACHE_KEY = 'dashboard_stats'
const DASHBOARD_CACHE_DURATION = 1000 * 60 * 5 // 5 minutes for dashboard stats

export const workflowCache = {
  // Get the current cache size
  getCacheSize: (): number => {
    try {
      let totalSize = 0
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(CACHE_PREFIX) || key === LIST_CACHE_KEY) {
          totalSize += localStorage.getItem(key)?.length || 0
        }
      }
      return totalSize
    } catch {
      return 0
    }
  },

  // Get metadata for a cached item
  getMetadata: (id: string): CacheMetadata | null => {
    try {
      const metadata = localStorage.getItem(`${METADATA_KEY}${id}`)
      return metadata ? JSON.parse(metadata) : null
    } catch {
      return null
    }
  },

  // Set metadata for a cached item
  setMetadata: (id: string, size: number) => {
    try {
      localStorage.setItem(
        `${METADATA_KEY}${id}`,
        JSON.stringify({
          timestamp: Date.now(),
          size
        })
      )
    } catch (error) {
      console.warn('Failed to save cache metadata:', error)
    }
  },

  // Clean up old cache entries if needed
  cleanupCache: (requiredSpace: number) => {
    try {
      const currentSize = workflowCache.getCacheSize()
      if (currentSize + requiredSpace <= MAX_CACHE_SIZE) {
        return true // No cleanup needed
      }

      // Get all workflow cache entries with their metadata
      const entries: { id: string; metadata: CacheMetadata }[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(CACHE_PREFIX) && !key.startsWith(METADATA_KEY)) {
          const id = key.replace(CACHE_PREFIX, '')
          const metadata = workflowCache.getMetadata(id)
          if (metadata) {
            entries.push({ id, metadata })
          }
        }
      }

      // Sort by timestamp (oldest first)
      entries.sort((a, b) => a.metadata.timestamp - b.metadata.timestamp)

      // Remove oldest entries until we have enough space
      let freedSpace = 0
      for (const entry of entries) {
        workflowCache.removeWorkflow(entry.id)
        freedSpace += entry.metadata.size

        if (currentSize - freedSpace + requiredSpace <= MAX_CACHE_SIZE) {
          return true
        }
      }

      return false // Couldn't free enough space
    } catch (error) {
      console.warn('Failed to cleanup cache:', error)
      return false
    }
  },

  // Get a single workflow from cache
  getWorkflow: (id: string): CachedWorkflow | null => {
    try {
      const cached = localStorage.getItem(`${CACHE_PREFIX}${id}`)
      if (!cached) {
        logger.log('info', 'cache', `Cache miss for workflow ${id}`)
        return null
      }

      const metadata = workflowCache.getMetadata(id)
      if (!metadata || Date.now() - metadata.timestamp > CACHE_DURATION) {
        logger.log('info', 'cache', `Cache expired for workflow ${id}`)
        workflowCache.removeWorkflow(id)
        return null
      }

      logger.log('info', 'cache', `Cache hit for workflow ${id}`)
      return JSON.parse(cached).data
    } catch {
      logger.log('error', 'cache', `Error reading workflow ${id} from cache`)
      return null
    }
  },

  // Set a single workflow in cache
  setWorkflow: (workflow: CachedWorkflow) => {
    try {
      const data = JSON.stringify({
        data: workflow,
        timestamp: Date.now()
      })

      const size = data.length
      
      if (!workflowCache.cleanupCache(size)) {
        logger.log('warn', 'cache', `Insufficient storage space for workflow ${workflow.id}`)
        return
      }

      localStorage.setItem(`${CACHE_PREFIX}${workflow.id}`, data)
      workflowCache.setMetadata(workflow.id, size)
      logger.log('info', 'cache', `Cached workflow ${workflow.id} (${size} bytes)`)
    } catch (error) {
      logger.log('error', 'cache', `Failed to cache workflow ${workflow.id}`)
    }
  },

  // Get the list of workflows from cache
  getWorkflowList: (): WorkflowListItem[] | null => {
    try {
      const cached = localStorage.getItem(LIST_CACHE_KEY)
      if (!cached) {
        return null
      }

      const metadata = workflowCache.getMetadata('list')
      if (!metadata || Date.now() - metadata.timestamp > CACHE_DURATION) {
        localStorage.removeItem(LIST_CACHE_KEY)
        localStorage.removeItem(`${METADATA_KEY}list`)
        return null
      }

      return JSON.parse(cached).data
    } catch {
      return null
    }
  },

  // Set the list of workflows in cache
  setWorkflowList: (workflows: WorkflowListItem[]) => {
    try {
      const data = JSON.stringify({
        data: workflows,
        timestamp: Date.now()
      })

      const size = data.length

      // Check if we need to clean up space
      if (!workflowCache.cleanupCache(size)) {
        console.warn('Could not cache workflow list: insufficient storage space')
        return
      }

      localStorage.setItem(LIST_CACHE_KEY, data)
      workflowCache.setMetadata('list', size)
    } catch (error) {
      console.warn('Failed to cache workflow list:', error)
    }
  },

  // Remove a workflow from cache
  removeWorkflow: (id: string) => {
    try {
      localStorage.removeItem(`${CACHE_PREFIX}${id}`)
      localStorage.removeItem(`${METADATA_KEY}${id}`)
      
      // Update the list cache if it exists
      const listCache = workflowCache.getWorkflowList()
      if (listCache) {
        const updatedList = listCache.filter(w => w.id !== id)
        workflowCache.setWorkflowList(updatedList)
      }
    } catch (error) {
      console.warn('Failed to remove workflow from cache:', error)
    }
  },

  // Clear all workflow caches
  clearCache: () => {
    try {
      // Clear list cache
      localStorage.removeItem(LIST_CACHE_KEY)
      localStorage.removeItem(`${METADATA_KEY}list`)
      
      // Clear individual workflow caches
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(CACHE_PREFIX) || key?.startsWith(METADATA_KEY)) {
          localStorage.removeItem(key)
        }
      }
    } catch (error) {
      console.warn('Failed to clear cache:', error)
    }
  },

  // Get FAQs for a workflow from cache
  getFAQs: (workflowId: string): FAQ[] | null => {
    try {
      const cached = localStorage.getItem(`${FAQ_CACHE_PREFIX}${workflowId}`)
      if (!cached) {
        logger.log('info', 'cache', `Cache miss for FAQs of workflow ${workflowId}`)
        return null
      }

      const { data, timestamp } = JSON.parse(cached)
      
      // Check if cache is expired
      if (Date.now() - timestamp > CACHE_DURATION) {
        logger.log('info', 'cache', `Cache expired for FAQs of workflow ${workflowId}`)
        localStorage.removeItem(`${FAQ_CACHE_PREFIX}${workflowId}`)
        return null
      }

      logger.log('info', 'cache', `Cache hit for FAQs of workflow ${workflowId}`)
      return data
    } catch {
      logger.log('error', 'cache', `Error reading FAQs from cache for workflow ${workflowId}`)
      return null
    }
  },

  // Set FAQs for a workflow in cache
  setFAQs: (workflowId: string, faqs: FAQ[]) => {
    try {
      const data = JSON.stringify({
        data: faqs,
        timestamp: Date.now()
      })

      const size = data.length
      
      if (!workflowCache.cleanupCache(size)) {
        logger.log('warn', 'cache', `Insufficient storage space for FAQs of workflow ${workflowId}`)
        return
      }

      localStorage.setItem(`${FAQ_CACHE_PREFIX}${workflowId}`, data)
      workflowCache.setMetadata(`faq_${workflowId}`, size)
      logger.log('info', 'cache', `Cached FAQs for workflow ${workflowId} (${size} bytes)`)
    } catch (error) {
      logger.log('error', 'cache', `Failed to cache FAQs for workflow ${workflowId}`)
    }
  },

  // Remove FAQs for a workflow from cache
  removeFAQs: (workflowId: string) => {
    try {
      localStorage.removeItem(`${FAQ_CACHE_PREFIX}${workflowId}`)
      localStorage.removeItem(`${METADATA_KEY}faq_${workflowId}`)
      logger.log('info', 'cache', `Removed FAQs for workflow ${workflowId} from cache`)
    } catch (error) {
      logger.log('error', 'cache', `Failed to remove FAQs for workflow ${workflowId} from cache`)
    }
  },

  // Get dashboard stats from cache
  getDashboardStats: (): DashboardStats | null => {
    try {
      const cached = localStorage.getItem(DASHBOARD_CACHE_KEY)
      if (!cached) {
        logger.log('info', 'cache', 'Cache miss for dashboard stats')
        return null
      }

      const data = JSON.parse(cached)
      
      // Check if cache is expired (using shorter duration for dashboard)
      if (Date.now() - data.timestamp > DASHBOARD_CACHE_DURATION) {
        logger.log('info', 'cache', 'Cache expired for dashboard stats')
        localStorage.removeItem(DASHBOARD_CACHE_KEY)
        return null
      }

      logger.log('info', 'cache', 'Cache hit for dashboard stats')
      return data
    } catch {
      logger.log('error', 'cache', 'Error reading dashboard stats from cache')
      return null
    }
  },

  // Set dashboard stats in cache
  setDashboardStats: (stats: Omit<DashboardStats, 'timestamp'>) => {
    try {
      const data = {
        ...stats,
        timestamp: Date.now()
      }

      const size = JSON.stringify(data).length
      
      if (!workflowCache.cleanupCache(size)) {
        logger.log('warn', 'cache', 'Insufficient storage space for dashboard stats')
        return
      }

      localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(data))
      workflowCache.setMetadata('dashboard', size)
      logger.log('info', 'cache', `Cached dashboard stats (${size} bytes)`)
    } catch (error) {
      logger.log('error', 'cache', 'Failed to cache dashboard stats')
    }
  },

  // Get context for a workflow
  getWorkflowContext: (workflowId: string): string | null => {
    try {
      const workflow = workflowCache.getWorkflow(workflowId)
      return workflow?.context || null
    } catch (error) {
      console.error('Error getting workflow context from cache:', error)
      return null
    }
  },

  // Update context for a workflow
  updateWorkflowContext: (workflowId: string, context: string) => {
    try {
      const workflow = workflowCache.getWorkflow(workflowId)
      if (workflow) {
        workflow.context = context
        workflowCache.setWorkflow(workflow)
      }
    } catch (error) {
      console.error('Error updating workflow context in cache:', error)
    }
  }
} 