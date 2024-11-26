import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // Validate request content type
    const contentType = request.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { success: false, message: 'Content type must be application/json' },
        { status: 400 }
      )
    }

    const workflow = await request.json()
    
    // Validate workflow data
    if (!workflow.name || !workflow.nodes || !workflow.edges) {
      return NextResponse.json(
        { success: false, message: 'Missing required workflow data' },
        { status: 400 }
      )
    }

    console.log('Received workflow:', workflow) // Debug log
    
    // TODO: Add your database logic here
    
    return NextResponse.json({ 
      success: true, 
      message: 'Workflow saved successfully',
      workflowId: 'mock-id-' + Date.now(),
      workflow 
    })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to save workflow'
      },
      { status: 500 }
    )
  }
}