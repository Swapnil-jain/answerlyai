import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      throw new Error('Workflow ID is required')
    }

    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      workflow: {
        id: data.id,
        name: data.name,
        nodes: data.nodes,
        edges: data.edges,
        updatedAt: data.updated_at
      }
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to load workflow'
      },
      { status: 500 }
    )
  }
} 