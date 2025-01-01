import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const subscriptionId = req.nextUrl.searchParams.get('subscriptionId')
    
    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 })
    }

    const response = await fetch(`${process.env.DODO_API_URL}/subscriptions/${subscriptionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.DODO_SECRET_KEY}`,
      }
    })

    const subscription = await response.json()
    
    return NextResponse.json(subscription)
  } catch (error) {
    
    return NextResponse.json({ error: 'Failed to fetch subscription details' }, { status: 500 })
  }
}