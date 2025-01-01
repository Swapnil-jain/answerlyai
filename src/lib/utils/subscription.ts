export type TierType = 'free' | 'hobbyist' | 'growth' | 'startup' | 'enterprise'

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
    
    
    return { success: false, error }
  }
}

export async function checkUserSubscription(supabase: any, userId: string) {
  try {
    

    // Get user tier
    const tierResult = await supabase
      .from('user_tiers')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (tierResult.error) {
      // If no tier found, return free tier
      if (tierResult.error.code === 'PGRST116') {
        return {
          tier: 'free',
          subscription: null,
          interval: null,
          amount: null
        }
      }
      throw tierResult.error
    }

    if (!tierResult.data) {
      
      return {
        tier: 'free',
        subscription: null,
        interval: null,
        amount: null
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
        amount: tierResult.data.subscription_amount
      },
      interval: tierResult.data.subscription_interval,
      amount: tierResult.data.subscription_amount
    }
    
    return result

  } catch (error: any) {
    return {
      tier: 'free',
      subscription: null,
      interval: null,
      amount: null
    }
  }
}