'use client'

import { useSupabase } from '@/lib/supabase/provider'
import { Button } from '@/components/ui/button'
import { Loader2, Sparkles, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import Image from 'next/image'
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
          scopes: 'email profile',
        }
      })
    } catch (error) {
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-sm border-b z-50">
        <div className="container mx-auto h-full px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="AnswerlyAI Logo" width={40} height={40} />
            <span className="text-2xl font-bold text-blue-600">AnswerlyAI</span>
            <div className="hidden sm:flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
              <span className="text-xs font-medium text-blue-600">Only.Relevant.Features.</span>
            </div>
          </Link>
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>

      {/* Login Content */}
      <div className="container mx-auto px-6 pt-32">
        <div className="max-w-md mx-auto">
          {/* Welcome Message */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Welcome to AnswerlyAI</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Sign in to your account
            </h1>
            <p className="text-gray-600">
              Create powerful chatbots in minutes, no coding required
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">Get Started Today</h3>
                    <p className="text-sm text-gray-600">
                      Transform your customer support in minutes
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full h-12 flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 border-2 shadow-sm"
                variant="outline"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <img src="/google-icon.svg" alt="Google" className="h-5 w-5" />
                )}
                Continue with Google
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 