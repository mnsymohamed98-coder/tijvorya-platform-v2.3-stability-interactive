import type { Product, Reel } from "@/types";

export type ReelPreferenceProfile = {
  categoryWeights: Record<string, number>;
  storeWeights: Record<string, number>;
  viewedReelIds: string[];
};

export const EMPTY_REEL_PROFILE: ReelPreferenceProfile = { categoryWeights: {}, storeWeights: {}, viewedReelIds: [] };

export function recordPreference(profile: ReelPreferenceProfile, input: { reel: Reel; product?: Product; signal: "view" | "like" | "save" | "cart" | "follow" }): ReelPreferenceProfile {
  const strength = { view: 1, like: 4, save: 5, cart: 8, follow: 6 }[input.signal];
  const category = input.product?.category?.trim().toLowerCase();
  return {
    categoryWeights: category ? { ...profile.categoryWeights, [category]: (profile.categoryWeights[category] ?? 0) + strength } : profile.categoryWeights,
    storeWeights: { ...profile.storeWeights, [input.reel.storeId]: (profile.storeWeights[input.reel.storeId] ?? 0) + strength },
    viewedReelIds: input.signal === "view" ? [input.reel.id, ...profile.viewedReelIds.filter((id) => id !== input.reel.id)].slice(0, 100) : profile.viewedReelIds,
  };
}

export function rankReels(reels: Reel[], products: Product[], profile: ReelPreferenceProfile) {
  const productById = new Map(products.map((product) => [product.id, product]));
  const now = Date.now();
  return [...reels].sort((a, b) => score(b) - score(a));
  function score(reel: Reel) {
    const product = productById.get(reel.productId);
    const category = product?.category?.trim().toLowerCase() ?? "";
    const ageHours = Math.max(1, (now - new Date(reel.createdAt).getTime()) / 3_600_000);
    const engagement = Math.log10(1 + reel.likes * 3 + reel.views * 0.08);
    const affinity = (profile.categoryWeights[category] ?? 0) * 1.8 + (profile.storeWeights[reel.storeId] ?? 0) * 1.4;
    const novelty = profile.viewedReelIds.includes(reel.id) ? -4 : 4;
    const freshness = Math.max(0, 8 - Math.log2(ageHours + 1));
    return engagement + affinity + novelty + freshness;
  }
}
