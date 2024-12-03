'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useSupabase } from '@/lib/supabase/provider'
import { workflowCache } from '@/lib/cache/workflowCache'
import { logger } from '@/lib/utils/logger'
import AuthGuard from '@/components/auth/AuthGuard'
import Header from '@/components/header'
import { Bot, BarChart2 } from 'lucide-react'
import { ensureUserTier } from '@/lib/utils/subscription'
import { TIER_LIMITS } from '@/lib/constants/tiers'

interface DashboardStats {
  activeChatbots: number
  totalChats: number
  averageResponseTime: number
  responseRate: number
  pricingTier: string
  workflowLimit: number
}

function DashboardContent() {
  const { supabase } = useSupabase()
  const [stats, setStats] = useState<DashboardStats>({
    activeChatbots: 0,
    totalChats: 0,
    averageResponseTime: 0,
    responseRate: 0,
    pricingTier: 'hobbyist',
    workflowLimit: Infinity
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardStats = useCallback(async () => {
    try {
      // Try to get from cache first
      const cachedStats = workflowCache.getDashboardStats()
      if (cachedStats) {
        // Ensure all properties are present
        setStats({
          activeChatbots: cachedStats.activeChatbots || 0,
          totalChats: cachedStats.totalChats || 0,
          averageResponseTime: cachedStats.averageResponseTime || 0,
          responseRate: cachedStats.responseRate || 0,
          pricingTier: cachedStats.pricingTier || 'hobbyist',
          workflowLimit: cachedStats.workflowLimit || Infinity
        })
        setIsLoading(false)
        // Optionally validate cache in background
        validateStatsInBackground()
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Ensure user has a tier entry
      await ensureUserTier(supabase, user.id)

      // Get user's pricing tier
      const { data: tierData, error: tierError } = await supabase
        .from('user_tiers')
        .select('pricing_tier, workflow_count')
        .eq('user_id', user.id)
        .single()

      if (tierError) throw tierError

      const currentTier = tierData?.pricing_tier || 'hobbyist'
      const workflowLimit = TIER_LIMITS[currentTier as keyof typeof TIER_LIMITS]

      // Get chat statistics
      let chatStats = []
      let avgResponseTime = 0
      let responseRate = 0

      try {
        const { data: chatData, error: chatError } = await supabase
          .from('chat_sessions')
          .select('*')
          .eq('user_id', user.id)

        if (!chatError && chatData) {
          chatStats = chatData
          // Calculate average response time
          avgResponseTime = chatData.reduce((acc, session) => 
            acc + (session.average_response_time || 0), 0) / (chatData.length || 1)

          // Calculate response rate
          const totalResponses = chatData.reduce((acc, session) => 
            acc + (session.successful_responses || 0), 0)
          const totalMessages = chatData.reduce((acc, session) => 
            acc + (session.total_messages || 0), 0)
          responseRate = totalMessages > 0 
            ? (totalResponses / totalMessages) * 100 
            : 0
        }
      } catch (error) {
        console.warn('Chat statistics not available:', error)
      }

      const newStats = {
        activeChatbots: tierData.workflow_count || 0,
        totalChats: chatStats.length,
        averageResponseTime: Number(avgResponseTime.toFixed(2)),
        responseRate: Number(responseRate.toFixed(1)),
        pricingTier: currentTier,
        workflowLimit: workflowLimit
      }

      setStats(newStats)
      setError(null)

      // Cache the new stats
      try {
        workflowCache.setDashboardStats(newStats)
      } catch (cacheError) {
        logger.log('warn', 'cache', 'Failed to cache dashboard stats')
      }

      logger.log('info', 'database', 'Dashboard stats fetched successfully')
    } catch (error) {
      console.error('Dashboard stats error:', error)
      setError('Failed to load dashboard data. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  // Add background validation function
  const validateStatsInBackground = async () => {
    try {
      // Fetch fresh data from database
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Ensure user has a tier entry
      await ensureUserTier(supabase, user.id)

      // Get user's pricing tier
      const { data: tierData, error: tierError } = await supabase
        .from('user_tiers')
        .select('pricing_tier, workflow_count')
        .eq('user_id', user.id)
        .single()

      if (tierError) throw tierError

      const currentTier = tierData?.pricing_tier || 'hobbyist'
      const workflowLimit = TIER_LIMITS[currentTier as keyof typeof TIER_LIMITS]

      // Get chat statistics
      let chatStats = []
      let avgResponseTime = 0
      let responseRate = 0

      try {
        const { data: chatData, error: chatError } = await supabase
          .from('chat_sessions')
          .select('*')
          .eq('user_id', user.id)

        if (!chatError && chatData) {
          chatStats = chatData
          // Calculate average response time
          avgResponseTime = chatData.reduce((acc, session) => 
            acc + (session.average_response_time || 0), 0) / (chatData.length || 1)

          // Calculate response rate
          const totalResponses = chatData.reduce((acc, session) => 
            acc + (session.successful_responses || 0), 0)
          const totalMessages = chatData.reduce((acc, session) => 
            acc + (session.total_messages || 0), 0)
          responseRate = totalMessages > 0 
            ? (totalResponses / totalMessages) * 100 
            : 0
        }
      } catch (error) {
        console.warn('Chat statistics not available:', error)
      }

      const newStats = {
        activeChatbots: tierData.workflow_count || 0,
        totalChats: chatStats.length,
        averageResponseTime: Number(avgResponseTime.toFixed(2)),
        responseRate: Number(responseRate.toFixed(1)),
        pricingTier: currentTier,
        workflowLimit: workflowLimit
      }

      // Compare with current stats and update if different
      const currentStats = stats
      if (JSON.stringify(currentStats) !== JSON.stringify(newStats)) {
        setStats(newStats)
        workflowCache.setDashboardStats(newStats)
      }
    } catch (error) {
      console.warn('Background validation failed:', error)
    }
  }

  useEffect(() => {
    fetchDashboardStats()
  }, [fetchDashboardStats])

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full flex items-center gap-2">
          <span className="font-medium capitalize">{stats.pricingTier} Plan</span>
          <span className="text-sm">
            ({stats.activeChatbots}/{stats.workflowLimit} chatbots)
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chatbots Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-6 w-6" />
              Chatbots
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-2">{stats.activeChatbots}</div>
            <p className="text-gray-600">Active chatbots</p>
          </CardContent>
        </Card>

        {/* Usage Analytics Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-6 w-6" />
              Usage Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Total Chats</span>
                  <span className="font-bold">{stats.totalChats}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Avg. Response Time</span>
                  <span className="font-bold">{stats.averageResponseTime}s</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Response Rate</span>
                  <span className="font-bold">{stats.responseRate}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <DashboardContent />
      </div>
    </AuthGuard>
  )
} 