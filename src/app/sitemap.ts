import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";
import { getPublicSitemapRecords } from "@/lib/seo-catalog";
import { merchantDomainUrl } from "@/lib/store-website";

export const revalidate = 3600;

const publicRoutes = ["", "/marketplace", "/reels", "/pricing", "/about", "/contact", "/privacy", "/terms", "/login", "/register"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fixed = (["ar", "en"] as const).flatMap((locale) => publicRoutes.map((route) => ({
    url: absoluteUrl(`/${locale}${route}`),
    lastModified: new Date("2026-07-31T00:00:00.000Z"),
    changeFrequency: route === "" || route === "/marketplace" || route === "/reels" ? "daily" as const : "monthly" as const,
    priority: route === "" ? 1 : route === "/marketplace" || route === "/reels" ? 0.9 : 0.6,
    alternates: { languages: { ar: absoluteUrl(`/ar${route}`), en: absoluteUrl(`/en${route}`) } },
  })));

  const catalog = await getPublicSitemapRecords();
  const productEntries = catalog.products.flatMap((product) => (["ar", "en"] as const).map((locale) => ({
    url: absoluteUrl(`/${locale}/product/${encodeURIComponent(product.id)}`),
    lastModified: product.created_at ? new Date(product.created_at) : undefined,
    changeFrequency: "weekly" as const,
    priority: 0.8,
    alternates: { languages: { ar: absoluteUrl(`/ar/product/${encodeURIComponent(product.id)}`), en: absoluteUrl(`/en/product/${encodeURIComponent(product.id)}`) } },
  })));
  const storeEntries = catalog.stores.flatMap((store) => (["", "/products", "/about"] as const).flatMap((page) => (["ar", "en"] as const).map((locale) => ({
    url: merchantDomainUrl(store.slug, locale, page === "" ? "home" : page.slice(1) as "products" | "about"),
    lastModified: store.created_at ? new Date(store.created_at) : undefined,
    changeFrequency: "weekly" as const,
    priority: page === "" ? 0.85 : 0.75,
    alternates: { languages: { ar: merchantDomainUrl(store.slug, "ar", page === "" ? "home" : page.slice(1) as "products" | "about"), en: merchantDomainUrl(store.slug, "en", page === "" ? "home" : page.slice(1) as "products" | "about") } },
  }))));

  return [...fixed, ...productEntries, ...storeEntries];
}
