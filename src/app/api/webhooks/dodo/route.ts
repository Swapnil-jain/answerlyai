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
      console.error('Missing webhook headers:', { webhookId, webhookSignature, webhookTimestamp })
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
        console.error('Error logging event:', logError)
      } else {
        console.log('Successfully logged event:', { subscriptionId, type: payload.type })
      }
    } catch (logError) {
      console.error('Error inserting into subscription_events:', logError)
    }

    // Handle different event types
    switch (payload.type) {
      case 'payment.failed': {
        console.log('Processing payment.failed event')
        const subscriptionId = payload.data.subscription_id
        const customerId = payload.data.customer.customer_id // user_id should be in metadata

        if (!subscriptionId) {
          console.log('No subscription ID in payment.failed event')
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
          console.error('Error updating subscription status:', updateError)
        }
        break
      }

      case 'subscription.active': {
        console.log('Processing subscription.active event')
        const subscriptionId = payload.data.subscription_id
        const productId = payload.data.product_id
        const customerId = payload.data.customer.customer_id
        const nextBillingDate = payload.data.next_billing_date

        if (!subscriptionId || !productId || !customerId) {
          console.log('Missing required data:', { subscriptionId, productId, customerId })
          break
        }

        // Get product details
        const productDetails = PRODUCT_DETAILS[productId as keyof typeof PRODUCT_DETAILS]
        if (!productDetails) {
          console.error('Invalid product ID:', productId)
          break
        }

        // Get existing user tier to preserve workflow count
        const { data: existingTier, error: fetchError } = await supabase
          .from('user_tiers')
          .select('*')
          .eq('customer_id', customerId)
          .single()

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error fetching existing tier:', fetchError)
          break
        }

        // Check if this is a subscription change that requires cancellation
        if (existingTier?.dodo_subscription_id && 
            existingTier.dodo_subscription_id !== subscriptionId &&
            (existingTier.subscription_status === 'active' || existingTier.subscription_status === 'pending_payment') &&
          (existingTier.pricing_tier !== 'free')) {
          console.log('Found existing active subscription:', existingTier.dodo_subscription_id)
          
          try {
            // Cancel the old subscription using the shared function
            await cancelSubscription(existingTier.dodo_subscription_id, 'upgrade_or_change')
            console.log('Successfully cancelled old subscription')
          } catch (cancelError) {
            console.error('Error cancelling old subscription:', cancelError)
            // Continue with the process even if cancellation fails
          }
        }

        // Prepare update with preserved workflow count
        const now = new Date().toISOString()
        const tierUpdate = {
          user_id: existingTier.user_id,
          pricing_tier: productDetails.tier,
          subscription_status: 'active',
          subscription_interval: productDetails.interval,
          subscription_amount: productDetails.amount,
          dodo_subscription_id: subscriptionId,
          workflow_count: existingTier?.workflow_count || 0,
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
          console.error('Error updating user tier:', updateError)
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
          console.error('Error logging payment:', logError)
        }

        break
      }

      case 'subscription.cancelled':
      case 'subscription.expired': {
        console.log('Processing subscription cancellation/expiration event')
        const subscriptionId = payload.data.subscription_id
        if (!subscriptionId) {
          console.log('No subscription ID in subscription event')
          break
        }

        // Check if subscription is already cancelled
        const { data: existingTier, error: fetchError } = await supabase
          .from('user_tiers')
          .select('subscription_status')
          .eq('dodo_subscription_id', subscriptionId)
          .single()

        if (fetchError) {
          console.error('Error fetching user tier:', fetchError)
          break
        }

        // Skip update if already cancelled (handled by cancel endpoint)
        if (existingTier?.subscription_status === 'cancelled') {
          console.log('Subscription already cancelled, skipping update')
          break
        }

        // Update user tier to free only if not already cancelled
        const { error: updateError } = await supabase
          .from('user_tiers')
          .update({
            pricing_tier: 'free',
            subscription_status: 'cancelled',
            subscription_interval: null,
            subscription_amount: null,
            updated_at: new Date().toISOString()
          })
          .eq('dodo_subscription_id', subscriptionId)

        if (updateError) {
          console.error('Error updating user tier:', updateError)
        }
        break
      }

      default:
        console.log('Unhandled event type:', payload.type)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
