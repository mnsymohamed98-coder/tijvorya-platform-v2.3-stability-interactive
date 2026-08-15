import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";
import { getPublicProductSeo, shortDescription } from "@/lib/seo-catalog";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }): Promise<Metadata> {
  const { locale, id } = await params;
  const normalizedLocale = locale === "en" ? "en" : "ar";
  const decodedId = decodeURIComponent(id);
  const product = await getPublicProductSeo(decodedId);
  if (!product) return { title: normalizedLocale === "ar" ? "المنتج" : "Product", robots: { index: false, follow: false } };
  const title = normalizedLocale === "ar" ? product.name : product.nameEn;
  const storeName = normalizedLocale === "ar" ? product.storeName : product.storeNameEn;
  const description = shortDescription(normalizedLocale === "ar" ? product.description : product.descriptionEn, normalizedLocale === "ar" ? `اشترِ ${title} من ${storeName} عبر Tijvorya.` : `Shop ${title} from ${storeName} on Tijvorya.`);
  const encodedId = encodeURIComponent(product.id);
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(`/${normalizedLocale}/product/${encodedId}`), languages: { ar: absoluteUrl(`/ar/product/${encodedId}`), en: absoluteUrl(`/en/product/${encodedId}`), "x-default": absoluteUrl(`/ar/product/${encodedId}`) } },
    openGraph: { type: "website", title, description, url: absoluteUrl(`/${normalizedLocale}/product/${encodedId}`), images: [{ url: product.image, alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [product.image] },
  };
}

export default async function ProductLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const product = await getPublicProductSeo(decodeURIComponent(id));
  const currency = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY?.trim().toUpperCase() || "ILS";
  const data = product ? {
    "@context": "https://schema.org", "@type": "Product", name: locale === "en" ? product.nameEn : product.name,
    description: shortDescription(locale === "en" ? product.descriptionEn : product.description, product.name), image: [product.image],
    brand: { "@type": "Brand", name: locale === "en" ? product.storeNameEn : product.storeName },
    offers: { "@type": "Offer", priceCurrency: currency, price: product.price, availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url: absoluteUrl(`/${locale === "en" ? "en" : "ar"}/product/${encodeURIComponent(product.id)}`) },
  } : null;
  return <>{data && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />}{children}</>;
}
