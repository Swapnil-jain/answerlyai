

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

interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

interface CacheOptions {
  batchKey?: string;
  pagination?: PaginationOptions;
}

const CACHE_PREFIX = 'workflow_'
const LIST_CACHE_KEY = 'workflow_list'
const METADATA_KEY = 'workflow_metadata_'
const CACHE_DURATION = 1000 * 60 * 60 * 24 // 24 hours for workflows and FAQs
const MAX_CACHE_SIZE = 10 * 1024 * 1024 // Increase to 10MB since modern browsers support larger localStorage
const FAQ_CACHE_PREFIX = 'faq_'
const DASHBOARD_CACHE_KEY = 'dashboard_stats'
const DASHBOARD_CACHE_DURATION = 1000 * 60 * 15 // 15 minutes for dashboard stats (needs to be fresher)

export const workflowCache = {
  // Check if cache is expired
  isCacheExpired: (timestamp: number, duration: number = CACHE_DURATION): boolean => {
    return Date.now() - timestamp > duration
  },

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
      
      return false
    }
  },

  // Get a single workflow from cache
  getWorkflow: (id: string): CachedWorkflow | null => {
    try {
      const metadata = workflowCache.getMetadata(id)
      if (!metadata || workflowCache.isCacheExpired(metadata.timestamp)) {
        workflowCache.removeWorkflow(id)
        return null
      }

      const cached = localStorage.getItem(`${CACHE_PREFIX}${id}`)
      if (!cached) return null

      
      return JSON.parse(cached).data
    } catch (error) {
      
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
        
        return
      }

      localStorage.setItem(`${CACHE_PREFIX}${workflow.id}`, data)
      workflowCache.setMetadata(workflow.id, size)
    } catch (error) {
      
    }
  },

  // Get the list of workflows from cache
  getWorkflowList: (): WorkflowListItem[] | null => {
    try {
      const metadata = workflowCache.getMetadata('list')
      if (!metadata || workflowCache.isCacheExpired(metadata.timestamp)) {
        workflowCache.clearCache()
        return null
      }

      const cached = localStorage.getItem(LIST_CACHE_KEY)
      if (!cached) return null

      
      return JSON.parse(cached).data
    } catch (error) {
      
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
        
        return
      }

      localStorage.setItem(LIST_CACHE_KEY, data)
      workflowCache.setMetadata('list', size)
    } catch (error) {
      
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
      
    }
  },

  // Set FAQs for a workflow in cache with batch operation support
  setFAQs(workflowId: string, faqs: FAQ[], options?: { batchKey?: string }) {
    try {
      const cacheKey = options?.batchKey ? 
        `${FAQ_CACHE_PREFIX}${workflowId}_${options.batchKey}` : 
        `${FAQ_CACHE_PREFIX}${workflowId}`

      const cacheData = {
        data: faqs,
        timestamp: Date.now()
      }

      localStorage.setItem(cacheKey, JSON.stringify(cacheData))
      this.setMetadata(`faq_${workflowId}`, JSON.stringify(cacheData).length)
      
    } catch (error) {
      
    }
  },

  // Get FAQs for a workflow from cache with batch support
  getFAQs(workflowId: string, options?: { batchKey?: string }): FAQ[] | null {
    try {
      const cacheKey = options?.batchKey ? 
        `${FAQ_CACHE_PREFIX}${workflowId}_${options.batchKey}` : 
        `${FAQ_CACHE_PREFIX}${workflowId}`

      const metadata = this.getMetadata(`faq_${workflowId}`)
      if (!metadata || this.isCacheExpired(metadata.timestamp)) {
        this.removeFAQs(workflowId)
        return null
      }

      const cached = localStorage.getItem(cacheKey)
      if (!cached) return null

      
      return JSON.parse(cached).data
    } catch (error) {
      
      return null
    }
  },

  // Remove FAQs for a workflow from cache with batch support
  removeFAQs(workflowId: string, options?: { batchKey?: string }) {
    try {
      const cacheKey = options?.batchKey ? 
        `${FAQ_CACHE_PREFIX}${workflowId}_${options.batchKey}` : 
        `${FAQ_CACHE_PREFIX}${workflowId}`

      localStorage.removeItem(cacheKey)
      localStorage.removeItem(`${METADATA_KEY}faq_${workflowId}`)
      
    } catch (error) {
      
    }
  },

  // Get dashboard stats from cache
  getDashboardStats: (): DashboardStats | null => {
    try {
      const cached = localStorage.getItem(DASHBOARD_CACHE_KEY)
      if (!cached) return null

      const stats: DashboardStats = JSON.parse(cached)
      if (workflowCache.isCacheExpired(stats.timestamp, DASHBOARD_CACHE_DURATION)) {
        localStorage.removeItem(DASHBOARD_CACHE_KEY)
        return null
      }

      
      return stats
    } catch (error) {
      
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
        
        return
      }

      localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(data))
      workflowCache.setMetadata('dashboard', size)
    } catch (error) {
      
    }
  },

  // Get context for a workflow
  getWorkflowContext: (workflowId: string): string | null => {
    try {
      const workflow = workflowCache.getWorkflow(workflowId)
      return workflow?.context || null
    } catch (error) {
      
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
      
    }
  },

  // Get paginated workflows from cache
  getPaginatedWorkflows(options?: PaginationOptions): { data: WorkflowListItem[]; total: number } | null {
    try {
      const cached = this.getWorkflowList()
      if (!cached) return null

      const { page = 1, limit = 10, offset = 0 } = options || {}
      const start = offset || (page - 1) * limit
      const end = start + limit

      return {
        data: cached.slice(start, end),
        total: cached.length
      }
    } catch (error) {
      
      return null
    }
  },

  // Get paginated FAQs from cache
  getPaginatedFAQs(workflowId: string, options?: CacheOptions): { data: FAQ[]; total: number } | null {
    try {
      const cached = this.getFAQs(workflowId, { batchKey: options?.batchKey })
      if (!cached) return null

      const { page = 1, limit = 10, offset = 0 } = options?.pagination || {}
      const start = offset || (page - 1) * limit
      const end = start + limit

      return {
        data: cached.slice(start, end),
        total: cached.length
      }
    } catch (error) {
      
      return null
    }
  },

  // Set workflows with pagination support
  setPaginatedWorkflows(workflows: WorkflowListItem[], options?: PaginationOptions) {
    try {
      const existing = this.getWorkflowList() || []
      const { offset = 0 } = options || {}

      // Replace items at the specified offset
      const updated = [
        ...existing.slice(0, offset),
        ...workflows,
        ...existing.slice(offset + workflows.length)
      ]

      this.setWorkflowList(updated)
      
    } catch (error) {
      
    }
  },

  // Set FAQs with pagination support
  setPaginatedFAQs(workflowId: string, faqs: FAQ[], options?: CacheOptions) {
    try {
      const existing = this.getFAQs(workflowId, { batchKey: options?.batchKey }) || []
      const { offset = 0 } = options?.pagination || {}

      // Replace items at the specified offset
      const updated = [
        ...existing.slice(0, offset),
        ...faqs,
        ...existing.slice(offset + faqs.length)
      ]

      this.setFAQs(workflowId, updated, { batchKey: options?.batchKey })
      
    } catch (error) {
      
    }
  }
} 