'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/lib/supabase/provider'
import { Loader2 } from 'lucide-react'

//loading page.
export default function AuthCallbackPage() {
  const { supabase } = useSupabase()
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { error } = await supabase.auth.getSession()
      if (!error) {
        router.push('/builder')
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