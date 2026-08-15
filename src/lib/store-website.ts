import type { Locale, StoreWebsiteProfile } from "@/types";

export const defaultStoreWebsiteProfile: StoreWebsiteProfile = {
  onboardingCompleted: false,
  businessCategory: "general",
  tagline: "",
  taglineEn: "",
  about: "",
  aboutEn: "",
  businessEmail: "",
  country: "",
  address: "",
  openingHours: "",
  shippingAreas: "",
  returnPolicy: "",
  instagram: "",
  facebook: "",
  tiktok: "",
  legalName: "",
  registrationNumber: "",
  domain: "",
};

export function normalizeStoreWebsiteProfile(profile?: Partial<StoreWebsiteProfile>): StoreWebsiteProfile {
  return {
    ...defaultStoreWebsiteProfile,
    ...profile,
    onboardingCompleted: profile?.onboardingCompleted === true,
  };
}

const categoryLabels: Record<string, { ar: string; en: string }> = {
  general: { ar: "متجر عام", en: "General store" },
  fashion: { ar: "أزياء وملابس", en: "Fashion & apparel" },
  beauty: { ar: "جمال وعناية", en: "Beauty & care" },
  electronics: { ar: "إلكترونيات وتقنية", en: "Electronics & tech" },
  accessories: { ar: "إكسسوارات ومجوهرات", en: "Accessories & jewelry" },
  home: { ar: "منزل وديكور", en: "Home & decor" },
  food: { ar: "طعام ومشروبات", en: "Food & beverage" },
  sports: { ar: "رياضة ولياقة", en: "Sports & fitness" },
  gifts: { ar: "هدايا ومناسبات", en: "Gifts & occasions" },
  services: { ar: "خدمات", en: "Services" },
  other: { ar: "أخرى", en: "Other" },
};

export function businessCategoryLabel(category: string, locale: Locale) {
  const label = categoryLabels[category] ?? categoryLabels.other;
  return label[locale];
}

export const businessCategoryOptions = Object.entries(categoryLabels).map(([value, label]) => ({ value, ...label }));

export function safeExternalUrl(value?: string) {
  const input = value?.trim();
  if (!input) return undefined;
  try {
    const candidate = /^https?:\/\//i.test(input) ? input : `https://${input.replace(/^@/, "")}`;
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

const RESERVED_SUBDOMAINS = new Set([
  "www", "app", "admin", "api", "auth", "dashboard", "mail", "support", "help", "cdn", "static", "assets", "store", "stores",
]);

export function isReservedStoreSlug(slug: string) {
  return RESERVED_SUBDOMAINS.has(slug.trim().toLowerCase());
}

export function storefrontRootDomain() {
  return process.env.NEXT_PUBLIC_STOREFRONT_ROOT_DOMAIN?.trim().toLowerCase() || "tijvorya.com";
}

export function merchantDomain(slug: string) {
  return `${slug.trim().toLowerCase()}.${storefrontRootDomain()}`;
}

export function merchantDomainUrl(slug: string, locale: Locale = "ar", page: "home" | "products" | "about" = "home") {
  const localePrefix = locale === "en" ? "/en" : "";
  const pageSuffix = page === "home" ? "" : `/${page}`;
  return `https://${merchantDomain(slug)}${localePrefix}${pageSuffix}`;
}

export function merchantStoreHref(slug: string, locale: Locale, page: "home" | "products" | "about" = "home") {
  if (process.env.NEXT_PUBLIC_STOREFRONT_SUBDOMAINS === "true") return merchantDomainUrl(slug, locale, page);
  const base = `/${locale}/store/${encodeURIComponent(slug)}`;
  return page === "home" ? base : `${base}/${page}`;
}
