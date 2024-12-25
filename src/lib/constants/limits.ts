export const LIMITS = {
  hobbyist: {
    tokensPerDay: 199500,  // ~150,000 words * 1.33
  },
  growth: {
    tokensPerDay: 532000,  // ~400,000 words * 1.33
  },
  startup: {
    tokensPerDay: 1330000,  // ~1,000,000 words * 1.33
  },
  enterprise: {
    tokensPerDay: Infinity
  }
} as const 

export type TierType = keyof typeof LIMITS