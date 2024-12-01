'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/lib/supabase/provider'
import { Loader2 } from 'lucide-react'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { supabase, session } = useSupabase()
  const router = useRouter()

  useEffect(() => {
    if (session === null) {
      router.push('/login')
    }
  }, [session, router])

  if (session === undefined) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (session === null) {
    return null
  }

  return <>{children}</>
} 