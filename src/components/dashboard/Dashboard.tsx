'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSupabase } from '@/lib/supabase/provider'
import { useAuth } from '@/hooks/useAuth'
import { workflowCache } from '@/lib/cache/workflowCache'
import Header from '@/components/header'
import AuthGuard from '@/components/auth/AuthGuard'
import { Bot, BarChart2 } from 'lucide-react'
import { ensureUserTier } from '@/lib/utils/subscription'
import { TIER_LIMITS } from '@/lib/constants/tiers'
import { LIMITS } from '@/lib/constants/limits'
import { EmailPreferencesForm } from '@/components/email-preferences/email-preferences-form'

interface DashboardStats {
  activeChatbots: number
  totalChats: number
  averageResponseTime: number
  responseRate: number
  pricingTier: string
  workflowLimit: number
  wordsRemaining: number
}

const CHAT_SESSION_RETENTION_DAYS = 30;
const CLEANUP_INTERVAL_DAYS = 7; // Only run cleanup weekly

function DashboardContent() {
  const { supabase } = useSupabase()
  const { getUser } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    activeChatbots: 0,
    totalChats: 0,
    averageResponseTime: 0,
    responseRate: 0,
    pricingTier: 'hobbyist',
    workflowLimit: 0,
    wordsRemaining: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cleanupOldChatSessions = async () => {
    try {
      const { data: { user } } = await getUser();
      if (!user) return;

      // Check if cleanup was run recently using localStorage
      const lastCleanup = localStorage.getItem('lastChatSessionCleanup');
      if (lastCleanup) {
        const daysSinceLastCleanup = (Date.now() - Number(lastCleanup)) / (1000 * 60 * 60 * 24);
        if (daysSinceLastCleanup < CLEANUP_INTERVAL_DAYS) {
          return; // Skip cleanup if run recently
        }
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - CHAT_SESSION_RETENTION_DAYS);

      await supabase
        .from('chat_sessions')
        .delete()
        .eq('user_id', user.id)
        .lt('started_at', cutoffDate.toISOString());

      // Record cleanup time
      localStorage.setItem('lastChatSessionCleanup', Date.now().toString());

    } catch (error) {
      
    }
  };

  // Fetch dashboard stats
  const fetchDashboardStats = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Try to get cached stats first
      const cachedStats = workflowCache.getDashboardStats()
      if (cachedStats) {
        setStats({
          activeChatbots: cachedStats.activeChatbots || 0,
          totalChats: cachedStats.totalChats || 0,
          averageResponseTime: cachedStats.averageResponseTime || 0,
          responseRate: cachedStats.responseRate || 0,
          pricingTier: cachedStats.pricingTier || 'hobbyist',
          workflowLimit: cachedStats.workflowLimit || 0,
          wordsRemaining: cachedStats.wordsRemaining || 0
        })
      }

      // Get user data
      const { data: { user } } = await getUser()
      if (!user) {
        throw new Error('User not found')
      }

      // Run cleanup before fetching stats
      await cleanupOldChatSessions();

      // Ensure user has a tier entry
      await ensureUserTier(supabase, user.id)

      // Get user's tier and rate limit info
      const today = new Date().toISOString().split('T')[0]

      // Batch fetch tier data, rate limits, and chat sessions
      const [{ data: tierData, error: tierError }, { data: rateLimitData, error: rateLimitError }, { data: chatData, error: chatError }] = await Promise.all([
        supabase
          .from('user_tiers')
          .select('pricing_tier, workflow_count')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('rate_limits')
          .select('daily_tokens')
          .eq('user_id', user.id)
          .eq('date', today)
          .single(),
        supabase
          .from('chat_sessions')
          .select('*')
          .eq('user_id', user.id)
      ])

      if (tierError) throw tierError
      if (rateLimitError && rateLimitError.code !== 'PGRST116') throw rateLimitError
      if (chatError) throw chatError

      const currentTier = tierData?.pricing_tier || 'hobbyist'
      const workflowLimit = TIER_LIMITS[currentTier as keyof typeof TIER_LIMITS]
      
      // Calculate remaining words
      const totalTokensUsed = rateLimitData?.daily_tokens || 0
      const totalTokensLimit = LIMITS[currentTier as keyof typeof LIMITS].tokensPerDay
      const wordsRemaining = totalTokensLimit === Infinity ? 
        Infinity : 
        Math.floor((totalTokensLimit - totalTokensUsed) / 1.33)

      // Calculate chat statistics
      let avgResponseTime = 0
      let responseRate = 0

      if (chatData && chatData.length > 0) {
        // Calculate average response time
        avgResponseTime = chatData.reduce((acc, session) => 
          acc + (session.average_response_time || 0), 0) / chatData.length

        // Calculate response rate
        const totalResponses = chatData.reduce((acc, session) => 
          acc + (session.successful_responses || 0), 0)
        const totalMessages = chatData.reduce((acc, session) => 
          acc + (session.total_messages || 0), 0)
        responseRate = totalMessages > 0 
          ? (totalResponses / totalMessages) * 100 
          : 0
      }

      const newStats = {
        activeChatbots: tierData.workflow_count || 0,
        totalChats: chatData?.length || 0,
        averageResponseTime: Number(avgResponseTime.toFixed(2)),
        responseRate: Number(responseRate.toFixed(1)),
        pricingTier: currentTier,
        workflowLimit: workflowLimit,
        wordsRemaining
      }

      setStats(newStats)
      setError(null)

      // Cache the new stats
      workflowCache.setDashboardStats(newStats)
    } catch (error) {
      
      setError('Failed to load dashboard data. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }, [supabase, getUser])

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
    <div className="container mx-auto px-4 py-8 mt-16 max-w-6xl">
      {/* Header with Plan Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">Welcome to AnswerlyAI</h1>
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium px-3 py-1.5 rounded-full bg-blue-100 text-blue-700">
            {stats.pricingTier.charAt(0).toUpperCase() + stats.pricingTier.slice(1)} Plan
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Words Remaining Today</h3>
            <Bot className="h-5 w-5 text-blue-500 opacity-75" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.pricingTier === 'enterprise' ? 'Unlimited' : stats.wordsRemaining.toLocaleString()}
          </div>
          {stats.pricingTier !== 'enterprise' && (
            <div className="flex items-baseline mt-1">
              <p className="text-sm text-gray-500">of</p>
              <p className="text-sm font-medium text-gray-600 ml-1">
                {Math.floor(LIMITS[stats.pricingTier as keyof typeof LIMITS].tokensPerDay / 1.33).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 ml-1">words per day</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Active Agents</h3>
            <Bot className="h-5 w-5 text-blue-500 opacity-75" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.activeChatbots}</div>
          <p className="text-sm text-gray-500 mt-1">of {stats.workflowLimit} allowed</p>
        </div>

        <a 
          href="/dashboard/subscription"
          className="group bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Subscription</h3>
              <svg className="h-5 w-5 text-blue-500 opacity-75" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="text-3xl font-bold text-gray-900 capitalize">{stats.pricingTier}</div>
            <p className="text-sm text-gray-500 mt-1">Click to manage plan</p>
          </div>
        </a>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Total Conversations</h3>
            <BarChart2 className="h-5 w-5 text-blue-500 opacity-75" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalChats}</div>
          <p className="text-sm text-gray-500 mt-1">across all agents</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Response Rate</h3>
            <BarChart2 className="h-5 w-5 text-blue-500 opacity-75" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.responseRate}%</div>
          <p className="text-sm text-gray-500 mt-1">{stats.averageResponseTime}s avg. time</p>
        </div>
      </div>

      {/* Email Preferences Section */}
      <div className="mt-8 max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Email Preferences</h2>
            <p className="mt-1 text-sm text-gray-500">Manage your email notification settings and preferences</p>
          </div>
          <div className="px-6 py-5">
            <EmailPreferencesForm />
          </div>
        </div>
      </div>

      {/* Minimalist Quote */}
      <div className="mb-8"></div>
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full mb-6">
          <span className="text-sm font-medium text-blue-600">Minimalism at Core</span>
        </div>
        <p className="text-lg text-gray-600 leading-relaxed mb-4">
          While others overwhelm with endless features, we focus on what truly matters. Our philosophy is simple: deliver powerful functionality through an elegantly minimal interface.
        </p>
        <p className="text-sm text-gray-500 italic">
          "The beauty of AnswerlyAI lies not in what we add, but in what we consciously choose to leave out."
        </p>
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