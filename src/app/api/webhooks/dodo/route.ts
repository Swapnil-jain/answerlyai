import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cancelSubscription } from '@/lib/dodo'
import { PRODUCT_DETAILS } from '@/lib/constants/tiers'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    // Get webhook verification headers
    const webhookId = req.headers.get('webhook-id')
    const webhookSignature = req.headers.get('webhook-signature')
    const webhookTimestamp = req.headers.get('webhook-timestamp')

    // Verify all required headers are present
    if (!webhookId || !webhookSignature || !webhookTimestamp) {
      
      return NextResponse.json({ error: 'Missing webhook headers' }, { status: 401 })
    }

    // Get the raw request body
    const rawBody = await req.text()
    const payload = JSON.parse(rawBody)
    console.log('Webhook received:', {
      body: payload,
    })

    // Always log the event, regardless of type
    try {
      const subscriptionId = payload.data?.subscription_id || 'unknown'
      const { error: logError } = await supabase
        .from('subscription_events')
        .insert({
          subscription_id: subscriptionId,
          event_type: payload.type,
          event_data: payload.data,
          created_at: new Date().toISOString()
        })

      if (logError) {
        
      } else {
        
      }
    } catch (logError) {
      
    }

    // Handle different event types
    switch (payload.type) {
      case 'payment.failed': {
        
        const subscriptionId = payload.data.subscription_id
        const customerId = payload.data.customer.customer_id // user_id should be in metadata

        if (!subscriptionId) {
          
          break
        }

        const { error: updateError } = await supabase
          .from('user_tiers')
          .update({
            subscription_status: 'active', //this is cuz it would be showing pending_payment
            updated_at: new Date().toISOString()
          })
          .eq('customer_id', customerId)

        if (updateError) {
          
        }
        break
      }

      case 'subscription.active': {
        
        const subscriptionId = payload.data.subscription_id
        const productId = payload.data.product_id
        const customerId = payload.data.customer.customer_id

        if (!subscriptionId || !productId || !customerId) {
          
          break
        }

        // Get product details
        const productDetails = PRODUCT_DETAILS[productId as keyof typeof PRODUCT_DETAILS]
        if (!productDetails) {
          
          break
        }

        // Get existing user tier to preserve workflow count
        const { data: existingTier, error: fetchError } = await supabase
          .from('user_tiers')
          .select('*')
          .eq('customer_id', customerId)
          .single()

        if (fetchError && fetchError.code !== 'PGRST116') {
          
          break
        }

        // Check if this is a subscription change that requires cancellation
        if (existingTier?.dodo_subscription_id && 
            existingTier.dodo_subscription_id !== subscriptionId &&
            (existingTier.subscription_status === 'active' || existingTier.subscription_status === 'pending_payment') &&
            (existingTier.pricing_tier !== 'free')) {
          
          
          try {
            // Cancel the old subscription using the shared function
            await cancelSubscription(existingTier.dodo_subscription_id, 'upgrade_or_change')
            
          } catch (cancelError) {
            
            // Continue with the process even if cancellation fails
          }
        }

        // Prepare update with preserved workflow count and clear cancellation_date
        const now = new Date().toISOString()
        const tierUpdate = {
          user_id: existingTier.user_id,
          pricing_tier: productDetails.tier,
          subscription_status: 'active',
          subscription_interval: productDetails.interval,
          subscription_amount: productDetails.amount,
          dodo_subscription_id: subscriptionId,
          workflow_count: existingTier?.workflow_count || 0,
          cancellation_date: null,  // Clear any existing cancellation date
          updated_at: now,
          created_at: existingTier?.created_at || now
        }

        // Update user's subscription tier
        const { error: updateError } = await supabase
          .from('user_tiers')
          .upsert({
            ...tierUpdate
          })

        if (updateError) {
          
          break
        }

        // Log the successful payment and subscription change
        const { error: logError } = await supabase
          .from('subscription_events')
          .insert({
            subscription_id: subscriptionId,
            event_type: 'payment.succeeded',
            event_data: {
              user_id: existingTier.user_id,
              product_id: productId,
              tier: productDetails.tier,
              interval: productDetails.interval,
              amount: productDetails.amount,
              workflow_count: tierUpdate.workflow_count,
              previous_subscription_id: existingTier?.dodo_subscription_id
            },
            created_at: now
          })

        if (logError) {
          
        }

        break
      }

      case 'subscription.cancelled': {
        
        const subscriptionId = payload.data.subscription_id
        const nextBillingDate = payload.data.next_billing_date

        if (!subscriptionId) {
          
          break
        }

        // Get the current subscription details
        const { data: existingTier, error: fetchError } = await supabase
          .from('user_tiers')
          .select('subscription_status')
          .eq('dodo_subscription_id', subscriptionId)
          .single()

        if (fetchError) {
          
          break
        }

        // If already cancelled (status is 'cancelled'), skip processing
        if (existingTier?.subscription_status === 'cancelled') {
          
          break
        }

        // Update the subscription status to pending_cancellation and store the cancellation date
        const { error: updateError } = await supabase
          .from('user_tiers')
          .update({
            subscription_status: 'pending_cancellation',
            cancellation_date: nextBillingDate,
            updated_at: new Date().toISOString()
          })
          .eq('dodo_subscription_id', subscriptionId)

        if (updateError) {
          
        }
        break
      }

      case 'subscription.expired': {
        
        const subscriptionId = payload.data.subscription_id
        
        if (!subscriptionId) {
          
          break
        }

        // When the subscription actually expires, update to free tier
        const { error: updateError } = await supabase
          .from('user_tiers')
          .update({
            pricing_tier: 'free',
            subscription_status: 'cancelled',
            subscription_interval: null,
            subscription_amount: null,
            cancellation_date: null,
            updated_at: new Date().toISOString()
          })
          .eq('dodo_subscription_id', subscriptionId)

        if (updateError) {
          
        }
        break
      }

      default:
        
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
