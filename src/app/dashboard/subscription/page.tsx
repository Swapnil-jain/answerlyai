'use client'

import { SubscriptionManagement } from '@/components/dashboard/subscription-management'
import AuthGuard from '@/components/auth/AuthGuard'

export default function SubscriptionPage() {
  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <a 
              href="/dashboard"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              <svg 
                className="w-4 h-4 mr-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Dashboard
            </a>
          </div>
          <h1 className="text-2xl font-bold mb-8">Subscription Management</h1>
          <SubscriptionManagement />
        </div>
      </div>
    </AuthGuard>
  )
}
