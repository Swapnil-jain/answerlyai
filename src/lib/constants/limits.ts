export const LIMITS = {
  training: {
    hobbyist: {
      tokensPerDay: 50000,
      tokensPerMinute: 2000,
      requestsPerDay: 1440,
      requestsPerMinute: 3
    },
    enterprise: {
      tokensPerDay: Infinity,
      tokensPerMinute: Infinity,
      requestsPerDay: Infinity,
      requestsPerMinute: Infinity
    }
  },
  chatting: {
    hobbyist: {
      tokensPerDay: 50000,
      tokensPerMinute: 2000,
      requestsPerDay: 1440,
      requestsPerMinute: 3
    },
    enterprise: {
      tokensPerDay: Infinity,
      tokensPerMinute: Infinity,
      requestsPerDay: Infinity,
      requestsPerMinute: Infinity
    }
  }
} as const 

export type LimitType = keyof typeof LIMITS
export type TierType = keyof typeof LIMITS['training'] 