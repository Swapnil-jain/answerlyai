class RateLimiterClass {
  private static instance: RateLimiterClass;
  private isServer: boolean;

  private constructor() {
    // Check if we're running on server side
    this.isServer = typeof window === 'undefined';
  }

  public static getInstance(): RateLimiterClass {
    if (!RateLimiterClass.instance) {
      RateLimiterClass.instance = new RateLimiterClass()
    }
    return RateLimiterClass.instance
  }

  public async checkRateLimit(
    userId: string, 
    type: 'training' | 'chatting',
    tokenCount: number
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const baseUrl = this.isServer ? process.env.NEXT_PUBLIC_APP_URL : '';
      const response = await fetch(`${baseUrl}/api/rate-limit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          type,
          tokenCount
        })
      })

      if (!response.ok) {
        throw new Error('Rate limit check failed')
      }

      return await response.json()
    } catch (error) {
      console.error('RateLimiter: Error checking rate limit:', error)
      return {
        allowed: false,
        reason: 'Rate limit check failed. Please try again later.'
      }
    }
  }

  public async recordTokenUsage(
    userId: string,
    type: 'training' | 'chatting',
    tokenCount: number
  ): Promise<void> {
    try {
      const baseUrl = this.isServer ? process.env.NEXT_PUBLIC_APP_URL : '';
      const response = await fetch(`${baseUrl}/api/rate-limit/record`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          type,
          tokenCount
        })
      })

      if (!response.ok) {
        throw new Error('Failed to record token usage')
      }
    } catch (error) {
      console.error('RateLimiter: Error recording token usage:', error)
    }
  }
}

// Export singleton instance
export const RateLimiter = {
  checkRateLimit: async (userId: string, type: 'training' | 'chatting', tokenCount: number) => {
    return await RateLimiterClass.getInstance().checkRateLimit(userId, type, tokenCount)
  },
  recordTokenUsage: async (userId: string, type: 'training' | 'chatting', tokenCount: number) => {
    await RateLimiterClass.getInstance().recordTokenUsage(userId, type, tokenCount)
  }
} 