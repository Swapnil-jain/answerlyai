import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/lib/utils/logger'

const CACHE_KEY = 'auth_user'
const CACHE_DURATION = 1000 * 60 * 5 // 5 minutes

interface CachedUser {
  user: any // Using any to match Supabase user type
  timestamp: number
  session?: { 
    access_token?: string 
  }
}

class AuthCache {
  private static instance: AuthCache

  private constructor() {}

  static getInstance(): AuthCache {
    if (!AuthCache.instance) {
      AuthCache.instance = new AuthCache()
    }
    return AuthCache.instance
  }

  private isCacheExpired(timestamp: number): boolean {
    return Date.now() - timestamp > CACHE_DURATION
  }

  private getCachedUser(): CachedUser | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (!cached) return null

      const parsedCache = JSON.parse(cached) as CachedUser
      if (this.isCacheExpired(parsedCache.timestamp)) {
        localStorage.removeItem(CACHE_KEY)
        return null
      }

      return parsedCache
    } catch (error) {
      logger.log('error', 'cache', 'Error reading from auth cache: ' + error)
      return null
    }
  }

  private setCachedUser(user: any, session?: { access_token?: string }) {
    try {
      const cacheData: CachedUser = {
        user,
        timestamp: Date.now(),
        session
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
    } catch (error) {
      logger.log('error', 'cache', 'Error writing to auth cache: ' + error)
    }
  }

  async getUserWithCache(supabase: SupabaseClient) {
    // Check cache first
    const cachedUser = this.getCachedUser()
    if (cachedUser) {
      return { 
        data: { 
          user: cachedUser.user, 
          session: cachedUser.session 
        }, 
        error: null 
      }
    }

    // If not in cache, fetch from Supabase
    try {
      const [sessionResponse, userResponse] = await Promise.all([
        supabase.auth.getSession(),
        supabase.auth.getUser()
      ])
      
      if (userResponse.data.user) {
        this.setCachedUser(
          userResponse.data.user, 
          sessionResponse.data.session || undefined
        )
      }
      
      return { 
        data: { 
          user: userResponse.data.user, 
          session: sessionResponse.data.session 
        }, 
        error: userResponse.error || sessionResponse.error 
      }
    } catch (error) {
      logger.log('error', 'cache', 'Error fetching user from Supabase: ' + error)
      return { data: { user: null, session: null }, error }
    }
  }

  clearCache() {
    localStorage.removeItem(CACHE_KEY)
  }
}

export const authCache = AuthCache.getInstance()
