import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { LIMITS, LimitType, TierType } from '@/lib/config/limits'

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

    // Get user's tier
    const { data: tierData } = await supabase
      .from('user_tiers')
      .select('pricing_tier')
      .eq('user_id', userId)
      .single()

    const tier = (tierData?.pricing_tier || 'hobbyist') as TierType
    const limits = LIMITS[type as LimitType][tier]

    // Get current usage
    const { data: rateLimit } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .eq('date', today)
      .maybeSingle()

    // Check daily token limit
    if (rateLimit?.daily_tokens + tokenCount > limits.tokensPerDay) {
      return NextResponse.json({
        allowed: false,
        reason: `Daily token limit (${limits.tokensPerDay.toLocaleString()}) exceeded`
      })
    }

    // Check daily request limit
    if (rateLimit?.daily_requests >= limits.requestsPerDay) {
      return NextResponse.json({
        allowed: false,
        reason: `Daily request limit (${limits.requestsPerDay.toLocaleString()}) exceeded`
      })
    }

    // Check per-minute token limit
    if (rateLimit?.last_minute === currentMinute) {
      if (rateLimit.minute_tokens + tokenCount > limits.tokensPerMinute) {
        return NextResponse.json({
          allowed: false,
          reason: `Per-minute token limit (${limits.tokensPerMinute.toLocaleString()}) exceeded`
        })
      }
    }

    // Check per-minute request limit
    if (rateLimit?.last_minute === currentMinute) {
      if (rateLimit.minute_requests >= limits.requestsPerMinute) {
        return NextResponse.json({
          allowed: false,
          reason: `Per-minute request limit (${limits.requestsPerMinute}) exceeded`
        })
      }
    }

    return NextResponse.json({ allowed: true })
  } catch (error) {
    console.error('Rate limit check error:', error)
    return NextResponse.json(
      { error: 'Failed to check rate limit' },
      { status: 500 }
    )
  }
} 