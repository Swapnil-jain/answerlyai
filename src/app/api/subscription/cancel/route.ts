import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { cancelSubscription } from '@/lib/dodo'

export async function POST(req: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      console.error('No authorization header')
      return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Create server-side Supabase client
    const serverSupabase = createServerSupabaseClient()

    // Verify the token
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Invalid token', details: authError }, { status: 401 })
    }

    console.log('User authenticated:', user.id)

    // Get user's subscription details
    const { data: userTier, error: tierError } = await serverSupabase
      .from('user_tiers')
      .select('dodo_subscription_id')
      .eq('user_id', user.id)
      .single()

    if (tierError) {
      console.error('Error fetching user tier:', tierError)
      return NextResponse.json({ error: 'Error fetching subscription details', details: tierError }, { status: 500 })
    }

    if (!userTier?.dodo_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
    }

    try {
      // Cancel subscription with Dodo
      await cancelSubscription(userTier.dodo_subscription_id, 'user_requested')

      // Update user tier status
      const { error: updateError } = await serverSupabase
        .from('user_tiers')
        .update({ 
          pricing_tier: 'free',
          subscription_status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Error updating user tier:', updateError)
        return NextResponse.json({ error: 'Error updating subscription status', details: updateError }, { status: 500 })
      }

      const response = NextResponse.json({ 
        message: 'Subscription cancelled successfully',
        redirect: '/dashboard'
      }, { status: 200 })
      
      return response
    } catch (cancelError) {
      console.error('Error cancelling subscription:', cancelError)
      return NextResponse.json({ error: 'Error cancelling subscription with payment provider', details: cancelError }, { status: 500 })
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
}
