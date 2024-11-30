'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useSupabase } from '@/lib/supabase/provider'
import AuthGuard from '@/components/auth/AuthGuard'
import Header from '@/components/header'
import { Bot, MessageSquare, Users, BarChart2 } from 'lucide-react'

interface DashboardStats {
  activeChatbots: number
  totalChats: number
  averageResponseTime: number
  responseRate: number
}

function DashboardContent() {
  const { supabase } = useSupabase()
  const [stats, setStats] = useState<DashboardStats>({
    activeChatbots: 0,
    totalChats: 0,
    averageResponseTime: 0,
    responseRate: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDashboardStats() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Fetch active chatbots (workflows)
        const { data: workflows, error: workflowError } = await supabase
          .from('workflows')
          .select('id')
          .eq('user_id', user.id)

        if (workflowError) throw workflowError

        // Safely fetch chat statistics
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
          console.warn('Chat statistics table might not exist yet:', error)
          // Continue with default values
        }

        setStats({
          activeChatbots: workflows?.length || 0,
          totalChats: chatStats.length,
          averageResponseTime: Number(avgResponseTime.toFixed(2)),
          responseRate: Number(responseRate.toFixed(1))
        })
        setError(null)
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        setError('Failed to load dashboard data. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardStats()
  }, [supabase])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
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
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
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