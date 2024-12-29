'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/lib/supabase/provider'
import { checkUserSubscription } from '@/lib/utils/subscription'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { supabase } = useSupabase()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error || !session) {
        router.push('/login')
        setIsAuthorized(false)
        return
      }

      const subscriptionData = await checkUserSubscription(supabase, session.user.id)
      console.log('Subscription check result:', subscriptionData)
      
      // Check if user has an active subscription
      const hasActiveSubscription = (subscriptionData.subscription?.status === 'active' || 
                                  subscriptionData.subscription?.status === 'pending_cancellation') && 
                                  subscriptionData.tier !== 'free'
      
      if (!hasActiveSubscription) {
        console.log('No active subscription found, redirecting to pricing')
        router.push('/pricing')
        setIsAuthorized(false)
        return
      }

      setIsAuthorized(true)
    }

    checkAuth()
  }, [supabase.auth, router])

  if (isAuthorized === null) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
} 