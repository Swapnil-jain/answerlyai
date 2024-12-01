export const TIER_LIMITS = {
  hobbyist: 1,
  enthusiast: 3,
  enterprise: 20
} as const;

export type PricingTier = keyof typeof TIER_LIMITS; 