import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/supabase-server'
import { LIMITS, TierType } from '@/lib/constants/limits'

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const { userId, tokenCount, recordOnly } = await request.json()

    if (!userId || typeof tokenCount !== 'number') {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      )
    }

    const today = new Date().toISOString().split('T')[0]

    // Get user's tier
    const { data: tierData, error: tierError } = await supabase
      .from('user_tiers')
      .select('pricing_tier')
      .eq('user_id', userId)
      .single()

    if (tierError) {
      
      return NextResponse.json(
        { error: 'Error fetching user tier' },
        { status: 500 }
      )
    }

    const tier = tierData.pricing_tier as TierType
    const limits = LIMITS[tier]

    if (!limits) {
      return NextResponse.json(
        { error: 'Invalid tier' },
        { status: 400 }
      )
    }

    // Get current usage
    const { data: rateLimit, error: rateLimitError } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle()

    if (rateLimitError && rateLimitError.code !== 'PGRST116') {
      
      return NextResponse.json(
        { error: 'Error fetching rate limit' },
        { status: 500 }
      )
    }

    // If this is just recording usage, update and return
    if (recordOnly) {
      
      
      if (rateLimit) {
        const { error: updateError } = await supabase
          .from('rate_limits')
          .update({
            daily_tokens: rateLimit.daily_tokens + tokenCount,
            updated_at: new Date().toISOString()
          })
          .eq('id', rateLimit.id)
        
        if (updateError) {
          
          return NextResponse.json({ error: 'Failed to update rate limit' }, { status: 500 });
        }
      } else {
        const { error: insertError } = await supabase
          .from('rate_limits')
          .insert({
            user_id: userId,
            date: today,
            daily_tokens: tokenCount,
            updated_at: new Date().toISOString()
          })
        
        if (insertError) {
          
          return NextResponse.json({ error: 'Failed to insert rate limit' }, { status: 500 });
        }
      }
      
      
      return NextResponse.json({ success: true })
    }

    // Calculate remaining tokens
    const currentTokens = rateLimit?.daily_tokens ?? 0
    const remainingTokens = limits.tokensPerDay === Infinity ? Infinity : limits.tokensPerDay - currentTokens

    // Check daily token limit
    if (limits.tokensPerDay !== Infinity && currentTokens + tokenCount > limits.tokensPerDay) {
      return NextResponse.json({
        allowed: false,
        reason: `Daily word limit (${Math.floor(limits.tokensPerDay / 1.33).toLocaleString()} words) exceeded`,
        remainingTokens
      })
    }

    return NextResponse.json({
      allowed: true,
      remainingTokens
    })
  } catch (error) {
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}