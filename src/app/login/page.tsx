'use client'

import { useSupabase } from '@/lib/supabase/provider'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

export default function LoginPage() {
  const { supabase } = useSupabase()
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true)
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      })
    } catch (error) {
      console.error('Error logging in:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b">
        <div className="container mx-auto h-full px-6 flex items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            AnswerlyAI
          </Link>
        </div>
      </div>

      {/* Login Content */}
      <div className="container mx-auto px-6 pt-32">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm border p-8">
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-500 text-center mb-8">
            Sign in to your account to continue
          </p>
          
          <Button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-white border hover:bg-gray-50 text-gray-700"
            variant="outline"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <img src="/google-icon.svg" alt="Google" className="h-4 w-4" />
            )}
            Continue with Google
          </Button>
        </div>
      </div>
    </div>
  )
} 