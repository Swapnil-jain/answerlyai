'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Loader2 } from 'lucide-react'

export default function PaymentSuccessPage() {
  const router = useRouter()
  const { supabase, getUser } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      try {
        const { data: { user } } = await getUser()
        if (!user) {
          router.push('/login')
          return
        }

        // Get the pending subscription ID from localStorage
        const subscriptionId = localStorage.getItem('pending_subscription_id')
        if (!subscriptionId) {
          setError('No pending subscription found')
          setLoading(false)
          return
        }

        // Verify subscription status
        const { data: subscription, error: subError } = await supabase
          .from('user_tiers')
          .select('subscription_status')
          .eq('user_id', user.id)
          .eq('dodo_subscription_id', subscriptionId)
          .single()

        if (subError || !subscription) {
          setError('Failed to verify subscription')
          setLoading(false)
          return
        }

        if (subscription.subscription_status === 'active') {
          // Clear the pending subscription ID
          localStorage.removeItem('pending_subscription_id')
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            router.push('/dashboard')
          }, 2000)
        } else if (subscription.subscription_status === 'pending_payment') {
          // Payment might still be processing, check again in 2 seconds
          setTimeout(() => {
            handlePaymentSuccess()
          }, 2000)
        } else {
          setError('Payment verification failed')
        }
      } catch (err) {
        
        setError('Failed to verify payment')
      } finally {
        setLoading(false)
      }
    }

    handlePaymentSuccess()
  }, [router, supabase, getUser])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Payment Error</h1>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => router.push('/pricing')}
            className="mt-4 text-blue-600 hover:underline"
          >
            Return to Pricing
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-green-600 mb-4">Payment Successful!</h1>
        <p className="text-gray-600">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying your subscription...
            </span>
          ) : (
            'Your subscription is being activated...'
          )}
        </p>
        <p className="text-sm text-gray-500 mt-4">You will be redirected to dashboard shortly...</p>
      </div>
    </div>
  )
}
