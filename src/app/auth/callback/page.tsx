'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/lib/supabase/provider'
import { Loader2 } from 'lucide-react'
import { checkUserSubscription, ensureUserTier } from '@/lib/utils/subscription'

export default function AuthCallbackPage() {
  const { supabase } = useSupabase()
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error || !session) {
        router.push('/login')
        return
      }

      // First ensure user has a tier entry (will be 'free' for new users).
      await ensureUserTier(supabase, session.user.id)

      // Then check subscription status
      const subscriptionData = await checkUserSubscription(supabase, session.user.id)
      const hasSubscription = subscriptionData.subscription?.status === 'active' || 
                            subscriptionData.tier !== 'free'

      // Redirect based on subscription status
      if (hasSubscription) {
        router.push('/builder')
      } else {
        router.push('/pricing')
      }
    }

    handleAuthCallback()
  }, [supabase.auth, router])

  return (
    <div className="h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  )
} 