import { useCallback } from 'react'
import { useSupabase } from '@/lib/supabase/provider'
import { authCache } from '@/lib/cache/authCache'

export function useAuth() {
  const { supabase } = useSupabase()

  const getUser = useCallback(async () => {
    return authCache.getUserWithCache(supabase)
  }, [supabase])

  return {
    supabase,
    getUser
  }
}
