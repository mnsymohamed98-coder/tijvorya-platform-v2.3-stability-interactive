import type { Locale } from "@/types";

const FALLBACK_SITE_URL = "https://tijvorya.com";

export const siteConfig = {
  name: "Tijvorya",
  url: normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
  defaultLocale: "ar" as Locale,
  locales: ["ar", "en"] as Locale[],
  social: {
    twitter: process.env.NEXT_PUBLIC_TWITTER_HANDLE?.trim() || undefined,
  },
};

export const localeSeo = {
  ar: {
    title: "Tijvorya — التجارة الاجتماعية والريلز القابلة للشراء",
    description: "منصة تجارة اجتماعية متعددة اللغات تجمع المتاجر والمنتجات والريلز القابلة للشراء والطلبات والتحليلات في تجربة واحدة.",
  },
  en: {
    title: "Tijvorya — Social commerce and shoppable reels",
    description: "A multilingual social-commerce platform unifying storefronts, products, shoppable reels, orders and analytics in one experience.",
  },
} satisfies Record<Locale, { title: string; description: string }>;

export function absoluteUrl(path = "/") {
  return new URL(path, `${siteConfig.url}/`).toString();
}

function normalizeSiteUrl(value: string | undefined) {
  try {
    const url = new URL(value?.trim() || FALLBACK_SITE_URL);
    return url.toString().replace(/\/$/, "");
  } catch {
    return FALLBACK_SITE_URL;
  }
}
