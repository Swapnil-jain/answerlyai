'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { Session, SupabaseClient } from '@supabase/supabase-js'
import { supabase } from './client'
import { Loader2 } from 'lucide-react'
import { workflowCache } from '@/lib/cache/workflowCache'
import { authCache } from '@/lib/cache/authCache'

interface SupabaseContext {
  supabase: SupabaseClient
  session: Session | null | undefined
}

const Context = createContext<SupabaseContext | undefined>(undefined)

export default function SupabaseProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const [session, setSession] = useState<Session | null>()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setIsLoading(false)
      console.log('Initial session:', session ? 'Authenticated' : 'Not authenticated')
    })

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: "INITIAL_SESSION" | "PASSWORD_RECOVERY" | "TOKEN_REFRESHED" | "USER_UPDATED" | "MFA_CHALLENGE_VERIFIED" | "SIGNED_OUT" | "SIGNED_IN" | "USER_DELETED", session) => {
      console.log('Auth state changed:', _event)
      // Only clear caches when user signs out or is deleted
      if (_event === 'SIGNED_OUT' || _event === 'USER_DELETED') {
        console.log('Clearing caches due to auth state change')
        workflowCache.clearCache()
        authCache.clearCache()
      }
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <Context.Provider value={{ supabase, session }}>
      {children}
    </Context.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useSupabase must be used inside SupabaseProvider')
  }
  return context
} 