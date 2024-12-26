'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useAuth } from '@/hooks/useAuth'
import { checkUserSubscription } from '@/lib/utils/subscription'
import { ArrowRight, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function SubscriptionManagement() {
  const { supabase, getUser } = useAuth()
  const router = useRouter()
  const [currentTier, setCurrentTier] = useState<'free' | 'hobbyist' | 'growth' | 'startup' | 'enterprise' | null>(null)
  const [subscriptionInterval, setSubscriptionInterval] = useState<'month' | 'year' | null>(null)
  const [subscriptionAmount, setSubscriptionAmount] = useState<number | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelConfirmText, setCancelConfirmText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null)

  useEffect(() => {
    const checkTier = async () => {
      const { data: { session } } = await getUser()
      if (session && 'user' in session && session.user.id) {
        const { tier, interval, amount, subscription } = await checkUserSubscription(supabase, session.user.id)
        setCurrentTier(tier)
        setSubscriptionInterval(interval)
        setSubscriptionAmount(amount)
        
        // If there's an active subscription, fetch its details
        if (subscription?.id && subscription.status === 'active') {
          try {
            const response = await fetch(`/api/subscription/details?subscriptionId=${subscription.id}`)
            if (response.ok) {
              const details = await response.json()
              setSubscriptionDetails(details)
            }
          } catch (error) {
            console.error('Error fetching subscription details:', error)
          }
        }
      }
    }
    checkTier()
  }, [supabase.auth])

  const handleUpgrade = () => {
    if (subscriptionInterval === 'month') {
      // Redirect to pricing page with yearly toggle pre-selected for the same tier
      router.push(`/pricing?interval=yearly&tier=${currentTier}`)
    } else {
      // Regular upgrade flow to next tier
      router.push('/pricing')
    }
  }

  const handleCancelAttempt = async () => {
    if (cancelConfirmText !== 'CANCEL MY SUBSCRIPTION') {
      return
    }
    
    setIsLoading(true)
    setError(null)
    try {
      // Ensure user is authenticated
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Please log in to cancel your subscription')
      }

      // Get the session token
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      const token = currentSession?.access_token

      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include', // Important for sending cookies
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription')
      }

      // Close dialog and redirect to dashboard
      setShowCancelDialog(false)
      if (data.redirect) {
        router.push(data.redirect)
      } else {
        router.refresh()
      }
    } catch (error: any) {
      console.error('Error cancelling subscription:', error)
      setError(error.message || 'Failed to cancel subscription')
    } finally {
      setIsLoading(false)
    }
  }

  const getTierDetails = () => {
    switch(currentTier) {
      case 'free':
        return {
          name: 'Free Plan',
          description: 'Basic features for personal use',
          limits: ['1 Chatbot', '10,000 words/day', '1 website']
        }
      case 'hobbyist':
        return {
          name: 'Hobbyist Plan',
          description: 'Perfect for small solo projects',
          limits: ['1 Chatbot', '150,000 words/day', '1 website', 'Basic Intelligence bot'],
          monthlyPrice: 19.90,
          yearlyPrice: 149.90
        }
      case 'growth':
        return {
          name: 'Growth Plan',
          description: 'Advanced features for growing businesses',
          limits: ['3 Chatbots', '400,000 words/day', '3 websites', 'Moderate intelligence bots'],
          monthlyPrice: 39.90,
          yearlyPrice: 299.90
        }
      case 'startup':
        return {
          name: 'Startup Plan',
          description: 'Premium features with best models',
          limits: ['Unlimited Chatbots', '1,000,000 words/day', 'Unlimited websites', 'Most intelligent bots'],
          monthlyPrice: 79.90,
          yearlyPrice: 599.90
        }
      case 'enterprise':
        return {
          name: 'Enterprise Plan',
          description: 'Custom features for large businesses',
          limits: ['Unlimited Chatbots', 'Unlimited words/day', 'Unlimited websites', 'Custom Integration'],
        }
      default:
        return {
          name: 'Loading...',
          description: '',
          limits: []
        }
    }
  }

  const tierDetails = getTierDetails()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Subscription</CardTitle>
          <CardDescription>Manage your subscription and usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{tierDetails.name}</h3>
              <p className="text-sm text-gray-500">
                {tierDetails.description}
                {subscriptionInterval && (
                  <span className="ml-2 text-blue-600">
                    (${subscriptionAmount?.toFixed(2)}/{subscriptionInterval}ly billing)
                  </span>
                )}
              </p>
              {subscriptionDetails?.next_billing_date && currentTier !== 'free' && (
                <p className="text-sm text-gray-600 mt-2">
                  Next billing date: {new Date(subscriptionDetails.next_billing_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Plan Limits:</h4>
              <ul className="list-disc list-inside space-y-1">
                {tierDetails.limits.map((limit, index) => (
                  <li key={index} className="text-sm text-gray-600">{limit}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex gap-4">
            {subscriptionInterval === 'month' && (currentTier === 'hobbyist' || currentTier === 'growth' || currentTier === 'startup') && 
             tierDetails.monthlyPrice !== undefined && tierDetails.yearlyPrice !== undefined && (
              <Button onClick={handleUpgrade} className="gap-2">
                Switch to Yearly (Save ${((tierDetails.monthlyPrice * 12) - tierDetails.yearlyPrice).toFixed(2)}/year)
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            {(currentTier === 'hobbyist' || currentTier === 'growth') && (
              <Button onClick={() => router.push('/pricing')} className="gap-2">
                Upgrade Tier
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
          {currentTier && currentTier !== 'free' && currentTier !== 'enterprise' && (
            <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  Cancel Subscription
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] bg-white">
                <DialogHeader className="space-y-6 pb-0">
                  <DialogTitle className="flex items-center gap-2 text-[28px]">
                    <AlertTriangle className="h-7 w-7 text-red-500" />
                    <span className="text-red-500 font-normal">Warning: Subscription Cancellation</span>
                  </DialogTitle>
                
                  <div className="text-[20px] leading-normal">
                    Are you absolutely sure you want to cancel your subscription? This action:
                  </div>

                  <ul className="list-disc pl-8 space-y-4 text-[20px] leading-normal break-words">
                    <li className="pr-4">Will IMMEDIATELY downgrade your account to Free tier</li>
                    <li className="pr-4">Will IMMEDIATELY remove access to all premium features</li>
                    <li className="pr-4">Will IMMEDIATELY reduce your daily word and request limits</li>
                    <li className="pr-4">Will IMMEDIATELY disrupt your active chatbots</li>
                    <li className="pr-4">Cannot be reversed without starting a new subscription</li>
                  </ul>
                </DialogHeader>

                <div className="mt-8 bg-[#E5E5E5] rounded-lg p-6">
                  <div className="text-[20px] text-red-500 font-normal mb-4">
                    Type CANCEL MY SUBSCRIPTION to confirm:
                  </div>
                  <input
                    type="text"
                    className="w-full px-4 py-3 text-[18px] border border-[#A3A3A3] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={cancelConfirmText}
                    onChange={(e) => setCancelConfirmText(e.target.value)}
                    placeholder="Type CANCEL MY SUBSCRIPTION"
                  />
                </div>

                {error && (
                  <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg">
                    {error}
                  </div>
                )}

                <DialogFooter className="flex justify-between mt-8 gap-4">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowCancelDialog(false)
                      setCancelConfirmText('')
                      setError(null)
                    }}
                    className="text-[18px] hover:bg-gray-100"
                  >
                    Never mind, keep my subscription
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleCancelAttempt}
                    disabled={cancelConfirmText !== 'CANCEL MY SUBSCRIPTION' || isLoading}
                    className="text-[18px] bg-red-500 hover:bg-red-600"
                  >
                    {isLoading ? 'Processing...' : 'Yes, cancel my subscription'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {currentTier === 'enterprise' && (
            <p className="text-sm text-gray-500 mt-2">
              Enterprise subscriptions cannot be cancelled through the dashboard. Please contact support for assistance.
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
