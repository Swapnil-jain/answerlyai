"use client"

import { Button } from './ui/button'
import Link from "next/link"
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'

export default function PricingSection() {
  const { supabase, getUser } = useAuth()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await getUser()
      setIsLoggedIn(!!session)
    }
    checkSession()
  }, [supabase.auth])

  const getStartedLink = isLoggedIn ? "/builder" : "/login"
  const mobileLink = "/mobile-notice"

  return (
    <section id="pricing" className="w-full py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">Simple, Transparent Pricing</h2>
          <p className="text-xl text-gray-600">Transform your customer support today</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Hobbyist Plan */}
          <div className="relative bg-white p-8 rounded-lg shadow-sm border flex flex-col">
            <div className="absolute -top-3 left-0 right-0 flex justify-center">
              <span className="px-4 py-1 bg-yellow-500 text-white text-sm rounded-full">
                Beta Testing Ongoing
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-4 mt-4">Hobbyist</h3>
            <p className="text-4xl font-bold mb-6">$9.90<span className="text-lg font-normal">/month</span></p>
            <ul className="space-y-4 mb-8 flex-grow">
              <li>✓ 1 Chatbot</li>
              <li>✓ Basic Analytics</li>
              <li>✓ Standard Support</li>
              <li>✓ 100,000 tokens/day</li>
              <li>✓ Embed on 1 website</li>
              <li>✗ AnswerlyAI watermark</li>
              <li>✗ No Customization</li>
            </ul>
            <div>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 hidden sm:block flex items-center justify-center"
                disabled
              >
                Coming Soon
              </Button>
            </div>
          </div>

          {/* Enthusiast Plan */}
          <div className="relative bg-blue-50 p-8 rounded-lg shadow-sm border border-blue-200 flex flex-col">
            <div className="absolute -top-3 left-0 right-0 flex justify-center">
              <span className="px-4 py-1 bg-yellow-500 text-white text-sm rounded-full">
              Beta Testing Ongoing
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-4 mt-4">Enthusiast</h3>
            <p className="text-4xl font-bold mb-6">$14.90<span className="text-lg font-normal">/month</span></p>
            <ul className="space-y-4 mb-8 flex-grow">
              <li>✓ 3 Chatbots</li>
              <li>✓ Advanced Analytics</li>
              <li>✓ Priority Support</li>
              <li>✓ 500,000 tokens/day</li>
              <li>✓ Embed on unlimited websites</li>
              <li>✓ Watermark removed</li>
              <li>✓ Full Customization</li>
            </ul>
            <div>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 hidden sm:block flex items-center justify-center"
                disabled
              >
                Coming Soon
              </Button>
 
            </div>
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
              <li>✓ Everything in Enthusiast</li>
              <li>✓ Dedicated Support</li>
              <li>✓ Customised limits</li>
              <li>✓ SLA Agreement</li>
              <li>✓ Advanced Security</li>
            </ul>
            <div>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 hidden sm:block flex items-center justify-center"
                disabled
              >
                Coming Soon
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
