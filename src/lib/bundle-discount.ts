export const BUNDLE_TIERS = [
  { min: 15, pct: 20 },
  { min: 10, pct: 15 },
  { min: 6, pct: 10 },
  { min: 3, pct: 5 },
] as const;

export function getBundleDiscountPct(photoCount: number): number {
  for (const tier of BUNDLE_TIERS) {
    if (photoCount >= tier.min) return tier.pct;
  }
  return 0;
}

export function nextTier(photoCount: number): { photosNeeded: number; nextPct: number } | null {
  for (let i = BUNDLE_TIERS.length - 1; i >= 0; i--) {
    const tier = BUNDLE_TIERS[i];
    if (photoCount < tier.min) {
      return { photosNeeded: tier.min - photoCount, nextPct: tier.pct };
    }
  }
  return null;
}
