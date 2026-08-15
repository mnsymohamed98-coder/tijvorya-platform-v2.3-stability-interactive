import type { Metadata } from "next";
import { getPublicStoreSeo, shortDescription } from "@/lib/seo-catalog";
import { merchantDomainUrl } from "@/lib/store-website";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = rawLocale === "en" ? "en" : "ar";
  const store = await getPublicStoreSeo(decodeURIComponent(slug));
  const name = store ? (locale === "ar" ? store.name : store.nameEn) : (locale === "ar" ? "المتجر" : "Store");
  const title = locale === "ar" ? `منتجات ${name}` : `${name} Products`;
  const description = store
    ? shortDescription(locale === "ar" ? store.description : store.descriptionEn, locale === "ar" ? `تصفح منتجات ${name}.` : `Browse products from ${name}.`)
    : locale === "ar" ? "تصفح منتجات المتجر على Tijvorya." : "Browse store products on Tijvorya.";
  return {
    title,
    description,
    alternates: {
      canonical: store ? merchantDomainUrl(store.slug, locale, "products") : undefined,
      languages: store ? { ar: merchantDomainUrl(store.slug, "ar", "products"), en: merchantDomainUrl(store.slug, "en", "products"), "x-default": merchantDomainUrl(store.slug, "ar", "products") } : undefined,
    },
    robots: store ? undefined : { index: false, follow: false },
  };
}

export default function ProductsLayout({ children }: { children: React.ReactNode }) { return children; }
