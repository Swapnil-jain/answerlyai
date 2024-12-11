import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { name, currentWorkflowId } = await request.json()

    let query = supabase
      .from('workflows')
      .select('id')
      .eq('name', name)

    if (currentWorkflowId) {
      query = query.neq('id', currentWorkflowId)
    }

    const { data, error } = await query.limit(1)

    if (error) throw error

    return NextResponse.json({
      success: true,
      exists: data.length > 0
    })
  } catch (error) {
    
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to check workflow name'
      },
      { status: 500 }
    )
  }
} 