import { TierType } from '../utils/subscription'

export const TIER_LIMITS = {
  free: 0,
  hobbyist: 1,
  enthusiast: 3,
  enterprise: 20
} as const;

export type PricingTier = TierType;