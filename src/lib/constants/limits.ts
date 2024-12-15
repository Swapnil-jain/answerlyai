export const LIMITS = {
  hobbyist: {
    tokensPerDay: 399000,  // ~300,000 words * 1.33
  },
  enthusiast: {
    tokensPerDay: 1330000,  // ~1,000,000 words * 1.33
  },
  enterprise: {
    tokensPerDay: Infinity
  }
} as const 

export type TierType = keyof typeof LIMITS