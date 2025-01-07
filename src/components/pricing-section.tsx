"use client"

import { Button } from './ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { checkUserSubscription } from '@/lib/utils/subscription'
import PaymentDialog from './payment-dialog'

export default function PricingSection() {
  const { supabase, getUser } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAnnual, setIsAnnual] = useState(true)
  const [currentTier, setCurrentTier] = useState<'free' | 'hobbyist' | 'growth' | 'startup' | null>(null)
  const [currentInterval, setCurrentInterval] = useState<'month' | 'year' | null>(null)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [selectedTier, setSelectedTier] = useState<'hobbyist' | 'growth' | 'startup'| null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await getUser()
      setIsLoggedIn(!!session)

      if (session && 'user' in session && session.user.id) {
        const { tier, interval } = await checkUserSubscription(supabase, session.user.id)
        setCurrentTier(tier)
        setCurrentInterval(interval)
        setCurrentUser(session.user)
      }
    }
    checkSession()
  }, [supabase.auth])

  useEffect(() => {
    // Handle URL parameters for interval and tier
    const interval = searchParams.get('interval')
    // Only update if interval parameter exists
    if (interval) {
      setIsAnnual(interval === 'yearly')
    }
  }, [searchParams])

  const getPrice = (monthly: number) => {
    if (isAnnual) {
      let yearlyPrice = monthly === 29.90 ? 239.90 : 
                        monthly === 59.90 ? 479.90 : 839.90;
      let monthlyPrice = yearlyPrice / 12;
      return {
        original: monthly.toFixed(2),
        discounted: monthlyPrice.toFixed(2),
        yearly: yearlyPrice.toFixed(2),
        savings: (monthly * 12 - yearlyPrice).toFixed(0)
      }
    }
    return {
      original: monthly.toFixed(2),
      discounted: monthly.toFixed(2),
      yearly: (monthly * 12).toFixed(2),
      savings: 0
    }
  }

  const hobbyistPrice = getPrice(29.90)
  const growthPrice = getPrice(59.90)
  const startupPrice = getPrice(99.90)

  // Product IDs for different tiers
  const productIds = {
    hobbyist: {
      monthly: process.env.NEXT_PUBLIC_DODO_HOBBYIST_MONTHLY || '',
      annual: process.env.NEXT_PUBLIC_DODO_HOBBYIST_ANNUAL || ''
    },
    growth: {
      monthly: process.env.NEXT_PUBLIC_DODO_GROWTH_MONTHLY || '',
      annual: process.env.NEXT_PUBLIC_DODO_GROWTH_ANNUAL || ''
    },
    startup: {
      monthly: process.env.NEXT_PUBLIC_DODO_STARTUP_MONTHLY || '',
      annual: process.env.NEXT_PUBLIC_DODO_STARTUP_ANNUAL || ''
    }
  }

  const handlePayment = async (tier: 'hobbyist' | 'growth' | 'startup') => {
    if (!isLoggedIn || !currentUser) {
      // Redirect to login if not logged in
      router.push('/login')
      return
    }

    // Don't allow payment for the same tier and interval
    if (tier === currentTier && 
        ((isAnnual && currentInterval === 'year') || (!isAnnual && currentInterval === 'month'))) {
      return
    }
    
    setSelectedTier(tier)
    setShowPaymentDialog(true)
  }

  // Add helper function to determine button state
  const getButtonConfig = (tier: 'hobbyist' | 'growth' | 'startup') => {
    // If not logged in or on free tier, show "Get Started"
    if (!isLoggedIn || currentTier === 'free') {
      return {
        text: 'Get Started',
        disabled: false,
        onClick: () => handlePayment(tier)
      }
    }

    // If this is user's current tier
    if (currentTier === tier && 
        ((isAnnual && currentInterval === 'year') || (!isAnnual && currentInterval === 'month'))) {
      return {
        text: 'Current Plan',
        disabled: true,
        onClick: () => {}
      }
    }

    // If user has a higher tier, disable downgrade
    const tierOrder = ['free', 'hobbyist', 'growth', 'startup']
    const currentTierIndex = tierOrder.indexOf(currentTier || 'free')
    const targetTierIndex = tierOrder.indexOf(tier)

    if (currentTierIndex > targetTierIndex) {
      return {
        text: 'Cancel Subscription to Downgrade',
        disabled: true,
        onClick: () => {}
      }
    }

    // If user has a lower tier, show upgrade
    if (currentTierIndex < targetTierIndex) {
      return {
        text: `Upgrade to ${tier.charAt(0).toUpperCase() + tier.slice(1)}`,
        disabled: false,
        onClick: () => handlePayment(tier)
      }
    }

    // Default case
    return {
      text: 'Get Started',
      disabled: false,
      onClick: () => handlePayment(tier)
    }
  }

  return (
    <section id="pricing" className="w-full py-20 bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">Simple, Transparent Pricing</h2>
          {currentTier && currentInterval && currentTier !== 'free' && (
            <div className="text-lg mb-4 p-4 bg-gradient-to-r from-blue-50 via-white to-blue-50 rounded-lg shadow-sm inline-block">
              <p className="font-semibold text-blue-600">Current plan: {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}</p>
              <p className="text-sm mt-2 text-gray-600">
                {currentInterval === 'year' 
                  ? "You're currently on annual billing - best value! 🌟"
                  : "You're on monthly billing - select a plan above to switch to annual for 33% savings! 💫"
                }
              </p>
            </div>
          )}
          <p className="text-xl text-gray-600 mb-8">Choose the perfect plan for your business.</p>
          
          <div className="flex items-center justify-center gap-3 mb-8">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>Monthly</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isAnnual ? 'bg-black' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition-transform ${isAnnual ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className={`text-sm font-medium ${isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>Annually</span>
            <span className="ml-1.5 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-600">
              Save 33%
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-8 2xl:gap-11 max-w-[1400px] mx-auto">
          {/* Hobbyist Plan */}
          <div className="relative bg-white p-8 rounded-lg shadow-sm border flex flex-col">
            <h3 className="text-2xl font-bold mb-4 mt-4">Hobbyist</h3>
            <div className="mb-6">
              <div className="flex flex-col items-start">
                {isAnnual && (
                  <div className="flex items-center gap-2">
                    <p className="text-lg text-gray-500 line-through">${hobbyistPrice.original}/mo</p>
                  </div>
                )}
                <div className="flex items-baseline">
                  <span className="text-3xl lg:text-3xl xl:text-4xl font-bold">${hobbyistPrice.discounted}</span>
                  <span className="text-base lg:text-lg font-normal ml-1">/mo</span>
                </div>
                {isAnnual && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs lg:text-sm text-gray-600">Billed ${hobbyistPrice.yearly} yearly</span>
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-600">
                      Save $120/y
                    </span>
                  </div>
                )}
              </div>
            </div>
            <Button 
              className="w-full mb-8 bg-blue-600 hover:bg-blue-700"
              onClick={getButtonConfig('hobbyist').onClick}
              disabled={getButtonConfig('hobbyist').disabled}
            >
              {getButtonConfig('hobbyist').text}
            </Button>
            <ul className="space-y-4 flex-grow">
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full text-white text-sm">✓</span>
                <span>150,000 words/day</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full text-white text-sm">✓</span>
                <span>1 Agent</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full text-white text-sm">✓</span>
                <span>Basic Intelligence agent</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full text-white text-sm">✓</span>
                <span>Embed on 1 website</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full text-white text-sm">✓</span>
                <span>Basic Analytics</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full text-white text-sm">✓</span>
                <span>Basic Support</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full text-white text-sm">✓</span>
                <span>Basic Customization</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-5 h-5 bg-red-500 rounded-full text-white text-sm">✗</span>
                <span>AnswerlyAI watermark</span>
              </li>
            </ul>
          </div>

          {/* Growth Plan */}
          <div className="relative bg-white p-8 rounded-lg shadow-sm border flex flex-col">
            <h3 className="text-2xl font-bold mb-4 mt-4">Growth</h3>
            <div className="mb-6">
              <div className="flex flex-col items-start">
                {isAnnual && (
                  <div className="flex items-center gap-2">
                    <p className="text-lg text-gray-500 line-through">${growthPrice.original}/mo</p>
                  </div>
                )}
                <div className="flex items-baseline">
                  <span className="text-3xl lg:text-3xl xl:text-4xl font-bold">${growthPrice.discounted}</span>
                  <span className="text-base lg:text-lg font-normal ml-1">/mo</span>
                </div>
                {isAnnual && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs lg:text-sm text-gray-600">Billed ${growthPrice.yearly} yearly</span>
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-600">
                    Save $240/y
                    </span>
                  </div>
                )}
              </div>
            </div>
            <Button 
              className="w-full mb-8 bg-blue-600 hover:bg-blue-700"
              onClick={getButtonConfig('growth').onClick}
              disabled={getButtonConfig('growth').disabled}
            >
              {getButtonConfig('growth').text}
            </Button>
            <ul className="space-y-4 flex-grow">
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full text-white text-sm">✓</span>
                <span>400,000 words/day</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full text-white text-sm">✓</span>
                <span>3 Agents</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full text-white text-sm">✓</span>
                <span>Moderately intelligent agents</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full text-white text-sm">✓</span>
                <span>Embed on 9 websites</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full text-white text-sm">✓</span>
                <span>Advanced Analytics</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full text-white text-sm">✓</span>
                <span>Standard Support</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full text-white text-sm">✓</span>
                <span>Moderate Customization</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full text-white text-sm">✓</span>
                <span>Watermark removed</span>
              </li>
            </ul>
          </div>

          {/* Replace the Enterprise Plan with Startup Plan */}
          <div className="relative bg-blue-700 p-8 rounded-lg shadow-lg border-2 border-blue-400 flex flex-col">
            <div className="absolute -top-3 left-0 right-0 flex justify-center gap-2">
              <span className="px-4 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full font-medium flex items-center">
                Most popular
                <span className="ml-2 inline-block animate-pulse bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 text-yellow-800 px-2 rounded-full text-xs font-bold">
                  3X-Value
                </span>
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-4 mt-4 text-white">Startup</h3>
            <div className="mb-6 text-white">
              <div className="flex flex-col items-start">
                {isAnnual && (
                  <div className="flex items-center gap-2">
                    <p className="text-lg text-blue-200 line-through">${startupPrice.original}/mo</p>
                  </div>
                )}
                <div className="flex items-baseline">
                  <span className="text-3xl lg:text-3xl xl:text-4xl font-bold">${startupPrice.discounted}</span>
                  <span className="text-base lg:text-lg font-normal ml-1">/mo</span>
                </div>
                {isAnnual && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs lg:text-sm text-blue-50">Billed ${startupPrice.yearly} yearly</span>
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Save $360/y
                    </span>
                  </div>
                )}
              </div>
            </div>
            <Button 
              className="w-full mb-8 bg-white text-blue-600 hover:bg-blue-50"
              onClick={getButtonConfig('startup').onClick}
              disabled={getButtonConfig('startup').disabled}
            >
              {getButtonConfig('startup').text}
            </Button>
            <ul className="space-y-4 flex-grow text-white">
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-5 h-5 bg-white rounded-full text-blue-600 text-sm">✓</span>
                <span>1,000,000 words/day</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-5 h-5 bg-white rounded-full text-blue-600 text-sm">✓</span>
                <span>Unlimited Agents</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-5 h-5 bg-white rounded-full text-blue-600 text-sm">✓</span>
                <span>Extremely intelligent agents</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-5 h-5 bg-white rounded-full text-blue-600 text-sm">✓</span>
                <span>Embed on unlimited websites</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-5 h-5 bg-white rounded-full text-blue-600 text-sm">✓</span>
                <span>Enterprise Analytics</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-5 h-5 bg-white rounded-full text-blue-600 text-sm">✓</span>
                <span>24/7 Highly Personalized Support</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-5 h-5 bg-white rounded-full text-blue-600 text-sm">✓</span>
                <span>Full Customization</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-5 h-5 bg-white rounded-full text-blue-600 text-sm">✓</span>
                <span>Watermark removed</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {selectedTier && currentUser && (
        <PaymentDialog
          isOpen={showPaymentDialog}
          onClose={() => {
            setShowPaymentDialog(false)
            setSelectedTier(null)
          }}
          tier={selectedTier}
          interval={isAnnual ? 'annual' : 'monthly'}
          productId={productIds[selectedTier][isAnnual ? 'annual' : 'monthly']}
          userId={currentUser.id}
        />
      )}
    </section>
  )
}
