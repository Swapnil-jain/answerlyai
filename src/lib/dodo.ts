export async function cancelSubscription(subscriptionId: string, cancellationReason: string) {
  if (!process.env.DODO_SECRET_KEY) {
    throw new Error('DODO_SECRET_KEY environment variable is not set')
  }

  const response = await fetch(
    `${process.env.DODO_API_URL}/subscriptions/${subscriptionId}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${process.env.DODO_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'cancelled'
      })
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to cancel subscription')
  }

  const data = await response.json()
  return data
}