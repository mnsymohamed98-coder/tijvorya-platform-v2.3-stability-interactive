import type { Metadata } from "next";
import { getPublicStoreSeo, shortDescription } from "@/lib/seo-catalog";
import { merchantDomainUrl } from "@/lib/store-website";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const normalizedLocale = locale === "en" ? "en" : "ar";
  const decodedSlug = decodeURIComponent(slug);
  const store = await getPublicStoreSeo(decodedSlug);
  if (!store) return { title: normalizedLocale === "ar" ? "المتجر" : "Store", robots: { index: false, follow: false } };
  const title = normalizedLocale === "ar" ? store.name : store.nameEn;
  const description = shortDescription(normalizedLocale === "ar" ? store.description : store.descriptionEn, normalizedLocale === "ar" ? `تسوّق من ${title} عبر Tijvorya.` : `Shop ${title} on Tijvorya.`);
  return {
    title,
    description,
    alternates: { canonical: merchantDomainUrl(store.slug, normalizedLocale), languages: { ar: merchantDomainUrl(store.slug, "ar"), en: merchantDomainUrl(store.slug, "en"), "x-default": merchantDomainUrl(store.slug, "ar") } },
    openGraph: { type: "website", title, description, url: merchantDomainUrl(store.slug, normalizedLocale), images: [{ url: store.cover, alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [store.cover] },
  };
}

export default async function StoreLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const store = await getPublicStoreSeo(decodeURIComponent(slug));
  const data = store ? {
    "@context": "https://schema.org", "@type": "Store", name: locale === "en" ? store.nameEn : store.name,
    description: shortDescription(locale === "en" ? store.descriptionEn : store.description, store.name), image: store.cover, logo: store.logo,
    url: merchantDomainUrl(store.slug, locale === "en" ? "en" : "ar"),
    address: store.city ? { "@type": "PostalAddress", addressLocality: store.city } : undefined,
  } : null;
  return <>{data && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />}{children}</>;
}
