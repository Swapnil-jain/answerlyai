interface TokenUsage {
  systemPrompt: number;
  faqs: number;
  workflow: number;
  context: number;
  message: number;
  total: number;
}

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
      
      
      if (!response.ok) {
        const errorMessage = data.error || 'Rate limit check failed';
        
        return {
          allowed: false,
          reason: errorMessage,
          remainingTokens: 0
        };
      }

      return data;
    } catch (error) {
      
      
      return {
        allowed: false,
        reason: 'Rate limit check failed. Please try again later.',
        remainingTokens: 0
      };
    }
  }

  public async recordDetailedTokenUsage(
    userId: string,
    usage: TokenUsage
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
          tokenCount: usage.total,
          usage: {
            systemPrompt: usage.systemPrompt,
            faqs: usage.faqs,
            workflow: usage.workflow,
            context: usage.context,
            message: usage.message
          },
          recordOnly: true
        })
      });

      if (!response.ok) {
        const data = await response.json();
        
        return false;
      }

      return true;
    } catch (error) {
      
      return false;
    }
  }

  public async estimateTokenUsage(
    message: string,
    history: any[],
    systemPromptLength: number,
    faqsLength: number,
    workflowLength: number,
    contextLength: number
  ): Promise<TokenUsage> {
    const CHARS_PER_TOKEN = 4;
    
    return {
      systemPrompt: Math.ceil(systemPromptLength / CHARS_PER_TOKEN),
      faqs: Math.ceil(faqsLength / CHARS_PER_TOKEN),
      workflow: Math.ceil(workflowLength / CHARS_PER_TOKEN),
      context: Math.ceil(contextLength / CHARS_PER_TOKEN),
      message: Math.ceil(message.length / CHARS_PER_TOKEN),
      total: Math.ceil(
        (systemPromptLength + faqsLength + workflowLength + 
         contextLength + message.length) / CHARS_PER_TOKEN
      )
    };
  }
}

// Export singleton instance
export const RateLimiter = {
  async checkRateLimit(userId: string, tokenCount: number) {
    return RateLimiterClass.getInstance().checkRateLimit(userId, tokenCount);
  },
  async recordDetailedTokenUsage(userId: string, usage: TokenUsage) {
    return RateLimiterClass.getInstance().recordDetailedTokenUsage(userId, usage);
  },
  async estimateTokenUsage(
    message: string,
    history: any[],
    systemPromptLength: number,
    faqsLength: number,
    workflowLength: number,
    contextLength: number
  ) {
    return RateLimiterClass.getInstance().estimateTokenUsage(
      message, history, systemPromptLength, faqsLength, 
      workflowLength, contextLength
    );
  }
}