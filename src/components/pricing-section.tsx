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
  const [currentTier, setCurrentTier] = useState<'free' | 'hobbyist' | 'enthusiast' | null>(null)
  const [currentInterval, setCurrentInterval] = useState<'month' | 'year' | null>(null)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [selectedTier, setSelectedTier] = useState<'hobbyist' | 'enthusiast' | null>(null)
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
    if (interval === 'yearly') {
      setIsAnnual(true)
    } else if (interval === 'monthly') {
      setIsAnnual(false)
    }
  }, [searchParams])

  const getPrice = (monthly: number) => {
    if (isAnnual) {
      const yearlyPrice = monthly === 9.90 ? 99.90 : 149.90
      const monthlyPrice = monthly === 9.90 ? 8.30 : 12.40
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

  const hobbyistPrice = getPrice(9.90)
  const enthusiastPrice = getPrice(14.90)

  // Product IDs for different tiers
  const productIds = {
    hobbyist: {
      monthly: process.env.NEXT_PUBLIC_DODO_HOBBYIST_MONTHLY || '',
      annual: process.env.NEXT_PUBLIC_DODO_HOBBYIST_ANNUAL || ''
    },
    enthusiast: {
      monthly: process.env.NEXT_PUBLIC_DODO_ENTHUSIAST_MONTHLY || '',
      annual: process.env.NEXT_PUBLIC_DODO_ENTHUSIAST_ANNUAL || ''
    }
  }

  const handlePayment = async (tier: 'hobbyist' | 'enthusiast') => {
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

  return (
    <section id="pricing" className="w-full py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">Simple, Transparent Pricing</h2>
          {currentTier && currentInterval && (
            <div className="text-lg mb-4 p-4 bg-gradient-to-r from-blue-50 via-white to-blue-50 rounded-lg shadow-sm inline-block">
              <p className="font-semibold text-blue-600">Current plan: {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}</p>
              <p className="text-sm mt-2 text-gray-600">
                {isAnnual ? (
                  currentInterval === 'month' ? 
                    "You're on annual billing - best value! 🌟" :
                    "You're on monthly billing - switch to annual for 40% savings! 💫"
                ) : (
                  currentInterval === 'year' ?
                    "You're on annual billing - best value! 🌟" :
                    "You're on monthly billing - switch to annual for 40% savings! 💫"
                )}
              </p>
            </div>
          )}
          <p className="text-xl text-gray-600 mb-8">Transform your customer support today</p>
          
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
              Save 20%
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Hobbyist Plan */}
          <div className="relative bg-white p-8 rounded-lg shadow-sm border flex flex-col">
            <h3 className="text-2xl font-bold mb-4">Hobbyist</h3>
            <div className="mb-6">
              {isAnnual && <p className="text-lg text-gray-500 line-through">${hobbyistPrice.original}/mo</p>}
              <p className="text-4xl font-bold">${hobbyistPrice.discounted}<span className="text-lg font-normal">/mo</span></p>
              {isAnnual && (
                <p className="text-sm text-gray-600 mt-1">
                  Billed ${hobbyistPrice.yearly} yearly
                  <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-600">
                    Save $20/y
                  </span>
                </p>
              )}
            </div>
            <Button 
              className="w-full mb-8 bg-blue-600 hover:bg-blue-700"
              onClick={() => handlePayment('hobbyist')}
              disabled={currentTier === 'hobbyist' && ((isAnnual && currentInterval === 'year') || (!isAnnual && currentInterval === 'month'))}
            >
              {currentTier === 'hobbyist' && ((isAnnual && currentInterval === 'year') || (!isAnnual && currentInterval === 'month')) 
                ? 'Current Plan' 
                : 'Get Started'}
            </Button>
            <ul className="space-y-4 flex-grow">
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full text-white text-sm">✓</span>
                <span>1 Chatbot</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full text-white text-sm">✓</span>
                <span>Basic Analytics</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full text-white text-sm">✓</span>
                <span>Standard Support</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full text-white text-sm">✓</span>
                <span>300,000 words/day</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full text-white text-sm">✓</span>
                <span>Embed on 1 website</span>
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

          {/* Enthusiast Plan */}
          <div className="relative bg-blue-600 p-8 rounded-lg shadow-lg border-2 border-blue-400 flex flex-col transform scale-105">
            <div className="absolute -top-3 left-0 right-0 flex justify-center gap-2">
              <span className="px-4 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full font-medium flex items-center">
                Most popular
                <span className="ml-2 inline-block animate-pulse bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 text-yellow-800 px-2 rounded-full text-xs font-bold">
                  3X-Value
                </span>
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-4 mt-4 text-white">Enthusiast</h3>
            <div className="mb-6 text-white">
              {isAnnual && <p className="text-lg text-blue-200 line-through">${enthusiastPrice.original}/mo</p>}
              <p className="text-4xl font-bold">${enthusiastPrice.discounted}<span className="text-lg font-normal">/mo</span></p>
              {isAnnual && (
                <p className="text-sm text-blue-100 mt-1">
                  Billed ${enthusiastPrice.yearly} yearly
                  <span className="ml-2 inline-flex items-center rounded-full bg-blue-200 px-2 py-0.5 text-xs font-medium text-blue-800">
                    Save $30/y
                  </span>
                </p>
              )}
            </div>
            <Button 
              className="w-full mb-8 bg-white text-blue-600 hover:bg-blue-50" 
              onClick={() => handlePayment('enthusiast')}
              disabled={currentTier === 'enthusiast' && ((isAnnual && currentInterval === 'year') || (!isAnnual && currentInterval === 'month'))}
            >
              {currentTier === 'enthusiast' && ((isAnnual && currentInterval === 'year') || (!isAnnual && currentInterval === 'month')) 
                ? 'Current Plan' 
                : 'Get Started'}
            </Button>
            <ul className="space-y-4 flex-grow text-white">
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-5 h-5 bg-white rounded-full text-blue-600 text-sm">✓</span>
                <span>3 Chatbots</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-5 h-5 bg-white rounded-full text-blue-600 text-sm">✓</span>
                <span>Advanced Analytics</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-5 h-5 bg-white rounded-full text-blue-600 text-sm">✓</span>
                <span>Priority Support</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-5 h-5 bg-white rounded-full text-blue-600 text-sm">✓</span>
                <span>1,000,000 words/day</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-5 h-5 bg-white rounded-full text-blue-600 text-sm">✓</span>
                <span>Embed on unlimited websites</span>
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

          {/* Enterprise Plan */}
          <div className="relative bg-white p-8 rounded-lg shadow-sm border flex flex-col">
            <h3 className="text-2xl font-bold mb-4 mt-4">Enterprise</h3>
            <div className="mb-6">
              <p className="text-4xl font-bold">Custom</p>
              <p className="text-lg text-gray-600">Contact us for pricing</p>
            </div>
            <Button 
              className="w-full mb-8 bg-blue-600 hover:bg-blue-700"
              onClick={() => window.location.href = 'mailto:answerlyai.cloud@gmail.com'}
            >
              Contact Us
            </Button>
            <ul className="space-y-4 flex-grow">
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full text-white text-sm">✓</span>
                <span>Unlimited Chatbots</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full text-white text-sm">✓</span>
                <span>Enterprise Analytics</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full text-white text-sm">✓</span>
                <span>24/7 Priority Support</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full text-white text-sm">✓</span>
                <span>Unlimited Tokens</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full text-white text-sm">✓</span>
                <span>Custom Backend Integration</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full text-white text-sm">✓</span>
                <span>On Demand Developer</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full text-white text-sm">✓</span>
                <span>SLA Compliance</span>
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
