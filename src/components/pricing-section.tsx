"use client"

import { Button } from './ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'

export default function PricingSection() {
  const { supabase, getUser } = useAuth()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAnnual, setIsAnnual] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await getUser()
      setIsLoggedIn(!!session)
    }
    checkSession()
  }, [supabase.auth])


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

  return (
    <section id="pricing" className="w-full py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">Simple, Transparent Pricing</h2>
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
            <div className="absolute -top-3 left-0 right-0 flex justify-center">
              <span className="px-4 py-1 bg-yellow-500 text-white text-sm rounded-full">
                Beta Testing Ongoing
              </span>
            </div>
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
            <ul className="space-y-4 mb-8 flex-grow">
              <li className="flex items-center gap-2">
                <span className="text-blue-500">✓</span>
                <span>1 Chatbot</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500">✓</span>
                <span>Basic Analytics</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500">✓</span>
                <span>Standard Support</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500">✓</span>
                <span>100,000 words/day</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500">✓</span>
                <span>Embed on 1 website</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-500">✗</span>
                <span>AnswerlyAI watermark</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-500">✗</span>
                <span>Customization</span>
              </li>
            </ul>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 hidden sm:block"
              disabled
            >
              Coming Soon
            </Button>
          </div>

          {/* Enthusiast Plan */}
          <div className="relative bg-white p-8 rounded-lg shadow-lg border-2 border-blue-500 flex flex-col transform scale-105">
            <div className="absolute -top-3 left-0 right-0 flex justify-center gap-2">
              <span className="px-4 py-1 bg-yellow-500 text-white text-sm rounded-full">
                Beta Testing Ongoing
              </span>
              <span className="px-4 py-1 bg-blue-100 text-blue-600 text-sm rounded-full font-medium">
                Most popular
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-4 mt-4">Enthusiast</h3>
            <div className="mb-6">
              {isAnnual && <p className="text-lg text-gray-500 line-through">${enthusiastPrice.original}/mo</p>}
              <p className="text-4xl font-bold">${enthusiastPrice.discounted}<span className="text-lg font-normal">/mo</span></p>
              {isAnnual && (
                <p className="text-sm text-gray-600 mt-1">
                  Billed ${enthusiastPrice.yearly} yearly
                  <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-600">
                    Save $30/y
                  </span>
                </p>
              )}
            </div>
            <ul className="space-y-4 mb-8 flex-grow">
              <li className="flex items-center gap-2">
                <span className="text-blue-500">✓</span>
                <span>3 Chatbots</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500">✓</span>
                <span>Advanced Analytics</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500">✓</span>
                <span>Priority Support</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500">✓</span>
                <span>500,000 words/day</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500">✓</span>
                <span>Embed on unlimited websites</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500">✓</span>
                <span>Watermark removed</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500">✓</span>
                <span>Full Customization</span>
              </li>
            </ul>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 hidden sm:block"
              disabled
            >
              Coming Soon
            </Button>
          </div>

          {/* Enterprise Plan */}
          <div className="relative bg-white p-8 rounded-lg shadow-sm border flex flex-col">
            <div className="absolute -top-3 left-0 right-0 flex justify-center">
              <span className="px-4 py-1 bg-yellow-500 text-white text-sm rounded-full">
                Beta Testing Ongoing
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-4 mt-4">Enterprise</h3>
            <div className="mb-6">
              <p className="text-4xl font-bold">Custom</p>
              <p className="text-lg text-gray-600">Contact us for pricing</p>
            </div>
            <ul className="space-y-4 mb-8 flex-grow">
              <li className="flex items-center gap-2">
                <span className="text-blue-500">✓</span>
                <span>Unlimited Chatbots</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500">✓</span>
                <span>Enterprise Analytics</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500">✓</span>
                <span>24/7 Priority Support</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500">✓</span>
                <span>Unlimited tokens</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500">✓</span>
                <span>Custom Integration</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500">✓</span>
                <span>White Label Solution</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500">✓</span>
                <span>API Access</span>
              </li>
            </ul>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 hidden sm:block"
              disabled
            >
              Coming Soon
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
