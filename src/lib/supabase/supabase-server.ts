import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export async function getUser(token: string) {
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error) throw error
  return user
}

export const createServerSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseKey)
} 
