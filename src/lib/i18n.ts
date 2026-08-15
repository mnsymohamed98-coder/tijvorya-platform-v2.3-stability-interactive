import type { Locale } from "@/types";

export const supportedLocales: Locale[] = ["ar", "en"];
export function normalizeLocale(value: string): Locale { return value === "en" ? "en" : "ar"; }
export function localize(locale: Locale, ar: string, en: string) { return locale === "ar" ? ar : en; }

export const copy = {
  ar: {
    brandTagline: "التجارة تبدأ من الفيديو",
    nav: { home: "الرئيسية", marketplace: "السوق", reels: "الريلز", pricing: "الباقات", about: "عن المنصة", login: "دخول", dashboard: "لوحة التاجر" },
    heroTitle: "منصة تجارة عربية تجعل الفيديو طريقًا مباشرًا إلى المبيعات.",
    heroText: "أنشئ متجرك، ارفع منتجاتك وريـلزك، واستقبل الطلبات من مكان واحد مصمم للتاجر والمتسوق العربي.",
    start: "ابدأ متجرك", explore: "استكشف السوق",
  },
  en: {
    brandTagline: "Commerce starts with video",
    nav: { home: "Home", marketplace: "Marketplace", reels: "Reels", pricing: "Plans", about: "About", login: "Sign in", dashboard: "Merchant dashboard" },
    heroTitle: "An Arabic commerce platform where video becomes a direct path to sales.",
    heroText: "Create your store, publish products and reels, and receive orders from one platform built for Arabic commerce.",
    start: "Start your store", explore: "Explore marketplace",
  },
} as const;
