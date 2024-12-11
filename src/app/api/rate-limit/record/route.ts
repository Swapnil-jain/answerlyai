import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const { userId, type, tokenCount } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const today = new Date().toISOString().split('T')[0]
    const currentMinute = Math.floor(Date.now() / 60000)
    
    // Get or create rate limit record
    const { data: rateLimit } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .eq('date', today)
      .maybeSingle()

    if (rateLimit) {
      // Update existing record
      const updates: any = {
        daily_tokens: rateLimit.daily_tokens + tokenCount,
        daily_requests: rateLimit.daily_requests + 1
      }

      // Reset or increment minute counters
      if (rateLimit.last_minute === currentMinute) {
        updates.minute_tokens = rateLimit.minute_tokens + tokenCount
        updates.minute_requests = rateLimit.minute_requests + 1
      } else {
        updates.minute_tokens = tokenCount
        updates.minute_requests = 1
        updates.last_minute = currentMinute
      }

      await supabase
        .from('rate_limits')
        .update(updates)
        .eq('id', rateLimit.id)
    } else {
      // Create new record
      await supabase
        .from('rate_limits')
        .insert([{
          user_id: userId,
          type,
          date: today,
          daily_tokens: tokenCount,
          daily_requests: 1,
          minute_tokens: tokenCount,
          minute_requests: 1,
          last_minute: currentMinute
        }])
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    
    return NextResponse.json(
      { error: 'Failed to record token usage' },
      { status: 500 }
    )
  }
} 