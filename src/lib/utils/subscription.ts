export type TierType = 'free' | 'hobbyist' | 'growth' | 'startup' | 'enterprise'

export type UserTier = {
  user_id: string;
  pricing_tier: TierType;
  workflow_count: number;
  created_at: string;
  updated_at: string;
  dodo_subscription_id: string | null;
  subscription_status: 'active' | 'cancelled' | null;
  subscription_interval: 'month' | 'year' | null;
  subscription_amount: number | null;
  next_billing_date: string | null;
}

export async function upgradeTier(supabase: any, userId: string, newTier: TierType) {
  try {
    const { error } = await supabase
      .from('user_tiers')
      .update({ 
        pricing_tier: newTier,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error upgrading tier:', error)
    return { success: false, error }
  }
}

export async function ensureUserTier(supabase: any, userId: string) {
  try {
    // Check if user already has a tier entry
    const { data: existingTier, error: checkError } = await supabase
      .from('user_tiers')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
      throw checkError
    }

    // If no tier exists or if existing tier is not set, set it to 'free'
    if (!existingTier || !existingTier.pricing_tier) {
      const { error: insertError } = await supabase
        .from('user_tiers')
        .upsert([
          {
            user_id: userId,
            pricing_tier: 'free',
            workflow_count: 0
          }
        ])

      if (insertError) throw insertError
    }

    return { success: true }
  } catch (error) {
    console.error('Error ensuring user tier:', error)
    return { success: false, error }
  }
}

export async function checkUserSubscription(supabase: any, userId: string) {
  try {
    console.log('Checking subscription for user:', userId)

    // Get user tier
    const tierResult = await supabase
      .from('user_tiers')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    console.log('Tier query result:', {
      data: tierResult.data,
      error: tierResult.error,
      status: tierResult.status
    })

    if (tierResult.error) {
      console.error('Error fetching user tier:', {
        code: tierResult.error.code,
        message: tierResult.error.message,
        details: tierResult.error.details,
        hint: tierResult.error.hint
      })
      // If no tier found, return free tier
      if (tierResult.error.code === 'PGRST116') {
        return {
          tier: 'free',
          subscription: null,
          interval: null,
          amount: null,
          next_billing_date: null
        }
      }
      throw tierResult.error
    }

    if (!tierResult.data) {
      console.log('No tier data found, returning free tier')
      return {
        tier: 'free',
        subscription: null,
        interval: null,
        amount: null,
        next_billing_date: null
      }
    }

    // Since we have all subscription info in user_tiers now, 
    // we don't need to query the subscriptions table
    const result = {
      tier: tierResult.data.pricing_tier,
      subscription: {
        id: tierResult.data.dodo_subscription_id,
        status: tierResult.data.subscription_status,
        interval: tierResult.data.subscription_interval,
        amount: tierResult.data.subscription_amount,
        next_billing_date: tierResult.data.next_billing_date
      },
      interval: tierResult.data.subscription_interval,
      amount: tierResult.data.subscription_amount,
      next_billing_date: tierResult.data.next_billing_date
    }
    console.log('Returning subscription data:', result)
    return result

  } catch (error: any) {
    console.error('Error checking user subscription:', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      stack: error?.stack
    })
    return {
      tier: 'free',
      subscription: null,
      interval: null,
      amount: null,
      next_billing_date: null
    }
  }
}