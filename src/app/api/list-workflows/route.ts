import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('workflows')
      .select('id, name, updated_at')
      .order('updated_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      workflows: data.map(workflow => ({
        id: workflow.id,
        name: workflow.name,
        updatedAt: workflow.updated_at
      }))
    })
  } catch (error) {
    console.error('Error listing workflows:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to list workflows'
      },
      { status: 500 }
    )
  }
} 