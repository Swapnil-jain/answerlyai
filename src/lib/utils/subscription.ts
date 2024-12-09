export async function upgradeTier(supabase: any, userId: string, newTier: 'hobbyist' | 'enthusiast' | 'enterprise') {
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

    // If no tier exists, create one
    if (!existingTier) {
      const { error: insertError } = await supabase
        .from('user_tiers')
        .insert([
          {
            user_id: userId,
            pricing_tier: 'hobbyist',
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