import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const workflow = await request.json()
    const { nodes, edges, name, id } = workflow

    // If updating existing workflow (when id is provided)
    if (id) {
      const { data, error } = await supabase
        .from('workflows')
        .update({
          name,
          nodes,
          edges,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        success: true,
        workflowId: data.id,
        message: 'Workflow updated successfully'
      })
    }

    // Creating new workflow (when no id is provided)
    const { data, error } = await supabase
      .from('workflows')
      .insert({
        name,
        nodes,
        edges,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      workflowId: data.id,
      message: 'Workflow saved successfully'
    })
  } catch (error) {
    
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to save workflow'
      },
      { status: 500 }
    )
  }
}