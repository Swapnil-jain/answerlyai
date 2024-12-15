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

  private getBaseUrl(): string {
    // For client-side requests, we can use relative URLs
    if (!this.isServer) {
      return '';
    }
    // For server-side requests, we need the full URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) {
      throw new Error('NEXT_PUBLIC_APP_URL is not set in environment variables');
    }
    return baseUrl;
  }

  public async checkRateLimit(
    userId: string, 
    tokenCount: number,
  ): Promise<{ allowed: boolean; reason?: string; remainingTokens?: number }> {
    try {
      const baseUrl = this.getBaseUrl();
      const url = `${baseUrl}/api/rate-limit`;
      
      console.log('RateLimiter checkRateLimit:', { userId, tokenCount, url });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          tokenCount,
          recordOnly: false
        })
      });

      const data = await response.json();
      console.log('RateLimiter response:', data);
      
      if (!response.ok) {
        const errorMessage = data.error || 'Rate limit check failed';
        console.error('RateLimiter: Server error:', { status: response.status, error: errorMessage });
        return {
          allowed: false,
          reason: errorMessage,
          remainingTokens: 0
        };
      }

      return data;
    } catch (error) {
      console.error('RateLimiter: Error checking rate limit:', error);
      return {
        allowed: false,
        reason: 'Rate limit check failed. Please try again later.',
        remainingTokens: 0
      };
    }
  }

  public async recordTokenUsage(
    userId: string,
    tokenCount: number
  ): Promise<boolean> {
    try {
      const baseUrl = this.getBaseUrl();
      const url = `${baseUrl}/api/rate-limit`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          tokenCount,
          recordOnly: true
        })
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('RateLimiter: Failed to record token usage:', data.error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('RateLimiter: Error recording token usage:', error);
      return false;
    }
  }
}

// Export singleton instance
export const RateLimiter = {
  async checkRateLimit(userId: string, tokenCount: number) {
    return RateLimiterClass.getInstance().checkRateLimit(userId, tokenCount);
  },
  async recordTokenUsage(userId: string, tokenCount: number) {
    return RateLimiterClass.getInstance().recordTokenUsage(userId, tokenCount);
  }
}