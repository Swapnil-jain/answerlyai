import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { billing, customer, productId, userId } = await req.json()

    if (!productId || !userId || !customer.email || !customer.name || !billing) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create subscription with Dodo
    const response = await fetch(`${process.env.DODO_API_URL}/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DODO_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        billing,
        customer,
        payment_link: true,
        product_id: productId,
        quantity: 1,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
        metadata: {
          user_id: userId
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      
      return NextResponse.json(
        { error: errorText },
        { status: 500 }
      )
    }

    const data = await response.json()
    
    // Store customer_id in user_tiers table
    const { error: updateError } = await supabase
      .from('user_tiers')
      .update({
        customer_id: data.customer.customer_id,
        subscription_status: 'pending_payment',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (updateError) {
      
      return NextResponse.json(
        { error: 'Failed to update user data' },
        { status: 500 }
      )
    }

    // Log the payment initiation
    const { error: logError } = await supabase
      .from('subscription_events')
      .insert({
        subscription_id: data.subscription_id,
        event_type: 'payment.initiated',
        event_data: {
          user_id: userId,
          product_id: productId,
          customer: customer,
          billing: billing,
          customer_id: data.customer.customer_id
        },
        created_at: new Date().toISOString()
      })

    if (logError) {
      
    }

    return NextResponse.json({
      payment_url: data.payment_link,
      subscription_id: data.subscription_id
    })
  } catch (error) {
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}