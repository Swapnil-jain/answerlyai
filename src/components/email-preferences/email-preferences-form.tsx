'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from '@/hooks/useAuth'

interface EmailPreferences {
  feedback_emails: boolean
  meeting_invites: boolean
  support_updates: boolean
}

export function EmailPreferencesForm() {
  const { supabase, getUser } = useAuth()
  const [email, setEmail] = useState("")
  const [preferences, setPreferences] = useState<EmailPreferences>({
    feedback_emails: true,
    meeting_invites: true,
    support_updates: true,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('user_tiers')
        .select('email, notification_preferences')
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Error loading preferences:', error)
        toast({
          title: "Error",
          description: "Failed to load email preferences.",
          variant: "destructive",
        })
        return
      }

      if (data) {
        setEmail(data.email || '')
        setPreferences(data.notification_preferences || preferences)
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "Failed to load email preferences.",
        variant: "destructive",
      })
    } finally {
      setIsInitializing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const { data: { user } } = await getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('user_tiers')
        .update({ 
          email, 
          notification_preferences: preferences,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
      
      if (error) throw error
      
      toast({
        title: "Success",
        description: "Your email preferences have been updated.",
      })
    } catch (error) {
      console.error('Error updating preferences:', error)
      toast({
        title: "Error",
        description: "Failed to update email preferences.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isInitializing) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-medium text-gray-900">Email Address</h3>
          <div className="mt-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <Checkbox
                id="feedback_emails"
                checked={preferences.feedback_emails}
                onCheckedChange={(checked) =>
                  setPreferences(prev => ({ ...prev, feedback_emails: checked === true }))
                }
              />
            </div>
            <div className="ml-3">
              <label htmlFor="feedback_emails" className="text-base font-medium text-gray-900">
                Feedback Emails
              </label>
              <p className="text-sm text-gray-500">Receive emails about feedback and suggestions</p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <Checkbox
                id="meeting_invites"
                checked={preferences.meeting_invites}
                onCheckedChange={(checked) =>
                  setPreferences(prev => ({ ...prev, meeting_invites: checked === true }))
                }
              />
            </div>
            <div className="ml-3">
              <label htmlFor="meeting_invites" className="text-base font-medium text-gray-900">
                Meeting Invites
              </label>
              <p className="text-sm text-gray-500">Receive calendar invitations for meetings</p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <Checkbox
                id="support_updates"
                checked={preferences.support_updates}
                onCheckedChange={(checked) =>
                  setPreferences(prev => ({ ...prev, support_updates: checked === true }))
                }
              />
            </div>
            <div className="ml-3">
              <label htmlFor="support_updates" className="text-base font-medium text-gray-900">
                Support Updates
              </label>
              <p className="text-sm text-gray-500">Receive updates about your support tickets</p>
            </div>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-gray-900 text-white hover:bg-gray-800 relative h-10"
        disabled={isLoading}
      >
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${isLoading ? 'opacity-100' : 'opacity-0'}`}>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        </div>
        <span className={`transition-opacity ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
          Save Preferences
        </span>
      </Button>
    </form>
  )
}
