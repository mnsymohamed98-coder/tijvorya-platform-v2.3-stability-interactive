import type { Metadata } from "next";
import { getPublicStoreSeo, shortDescription } from "@/lib/seo-catalog";
import { merchantDomainUrl } from "@/lib/store-website";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = rawLocale === "en" ? "en" : "ar";
  const store = await getPublicStoreSeo(decodeURIComponent(slug));
  const name = store ? (locale === "ar" ? store.name : store.nameEn) : (locale === "ar" ? "المتجر" : "Store");
  const title = locale === "ar" ? `عن ${name}` : `About ${name}`;
  const description = store
    ? shortDescription(locale === "ar" ? store.description : store.descriptionEn, locale === "ar" ? `تعرف على ${name}.` : `Learn more about ${name}.`)
    : locale === "ar" ? "تعرف على المتجر ومعلومات التواصل." : "Learn about the store and contact information.";
  return {
    title,
    description,
    alternates: {
      canonical: store ? merchantDomainUrl(store.slug, locale, "about") : undefined,
      languages: store ? { ar: merchantDomainUrl(store.slug, "ar", "about"), en: merchantDomainUrl(store.slug, "en", "about"), "x-default": merchantDomainUrl(store.slug, "ar", "about") } : undefined,
    },
    robots: store ? undefined : { index: false, follow: false },
  };
}

export default function AboutLayout({ children }: { children: React.ReactNode }) { return children; }
