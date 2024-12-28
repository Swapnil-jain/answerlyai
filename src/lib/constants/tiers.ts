import { TierType } from '../utils/subscription'

export const TIER_LIMITS = {
  free: 0,
  hobbyist: 1,
  growth: 3,
  startup: Infinity,
  enterprise: Infinity
} as const;

export type PricingTier = TierType;

export const PRODUCT_DETAILS = {
  [process.env.NEXT_PUBLIC_DODO_HOBBYIST_MONTHLY!]: { tier: 'hobbyist', interval: 'month', amount: 29.90 },
  [process.env.NEXT_PUBLIC_DODO_HOBBYIST_ANNUAL!]: { tier: 'hobbyist', interval: 'year', amount: 239.90 },
  [process.env.NEXT_PUBLIC_DODO_GROWTH_MONTHLY!]: { tier: 'growth', interval: 'month', amount: 59.90 },
  [process.env.NEXT_PUBLIC_DODO_GROWTH_ANNUAL!]: { tier: 'growth', interval: 'year', amount: 479.90 },
  [process.env.NEXT_PUBLIC_DODO_STARTUP_MONTHLY!]: { tier: 'startup', interval: 'month', amount: 99.90 },
  [process.env.NEXT_PUBLIC_DODO_STARTUP_ANNUAL!]: { tier: 'startup', interval: 'year', amount: 839.90 }
} as const