"use client"

import { Button } from './ui/button'
import Link from "next/link"
import { useSupabase } from '@/lib/supabase/provider'
import { useEffect, useState } from 'react'

export default function PricingSection() {
  const { supabase } = useSupabase()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session)
    }
    checkSession()
  }, [supabase.auth])

  const getStartedLink = isLoggedIn ? "/builder" : "/login"

  return (
    <section id="pricing" className="w-full py-20 bg-slate-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">Simple, Transparent Pricing</h2>
          <p className="text-xl text-gray-600">No credit card required to start</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Hobbyist Plan */}
          <div className="relative bg-white p-8 rounded-lg shadow-sm border flex flex-col">
            <div className="absolute -top-3 left-0 right-0 flex justify-center">
              <span className="px-4 py-1 bg-blue-500 text-white text-sm rounded-full">
                Beta Testing Ongoing
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-4 mt-4">Hobbyist</h3>
            <p className="text-4xl font-bold mb-6">$0<span className="text-lg font-normal">/month</span></p>
            <ul className="space-y-4 mb-8 flex-grow">
              <li>✓ 1 Chatbot</li>
              <li>✓ Basic Analytics</li>
              <li>✓ Standard Support</li>
              <li>✓ Basic Customization</li>
              <li>✓ 100,000 tokens/day</li>
            </ul>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700"
              asChild
            >
              <Link href={getStartedLink}>Get Started</Link>
            </Button>
          </div>

          {/* Enthusiast Plan */}
          <div className="relative bg-blue-50 p-8 rounded-lg shadow-sm border border-blue-200 flex flex-col">
            <div className="absolute -top-3 left-0 right-0 flex justify-center">
              <span className="px-4 py-1 bg-yellow-500 text-white text-sm rounded-full">
                Coming Soon
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-4 mt-4">Enthusiast</h3>
            <p className="text-4xl font-bold mb-6">$14.90<span className="text-lg font-normal">/month</span></p>
            <ul className="space-y-4 mb-8 flex-grow">
              <li>✓ 3 Chatbots</li>
              <li>✓ Advanced Analytics</li>
              <li>✓ Priority Support</li>
              <li>✓ Full Customization</li>
              <li>✓ 500,000 tokens/day</li>
              <li>✓ Embed on unlimited websites</li>
            </ul>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled
            >
              Coming Soon
            </Button>
          </div>

          {/* Enterprise Plan */}
          <div className="relative bg-white p-8 rounded-lg shadow-sm border flex flex-col">
            <div className="absolute -top-3 left-0 right-0 flex justify-center">
              <span className="px-4 py-1 bg-yellow-500 text-white text-sm rounded-full">
                Coming Soon
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-4 mt-4">Enterprise</h3>
            <div className="mb-6">
              <p className="text-4xl font-bold">Custom</p>
              <p className="text-lg text-gray-600">Contact us for pricing</p>
            </div>
            <ul className="space-y-4 mb-8 flex-grow">
              <li>✓ Everything in Business</li>
              <li>✓ Dedicated Support</li>
              <li>✓ Customised limits</li>
              <li>✓ SLA Agreement</li>
              <li>✓ Advanced Security</li>
            </ul>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700"
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

