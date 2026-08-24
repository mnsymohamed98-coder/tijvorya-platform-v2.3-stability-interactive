import type { Metadata } from "next";

import { absoluteUrl } from "@/lib/site";

import {
  getPublicStoreSeo,
  shortDescription,
} from "@/lib/seo-catalog";

import {
  merchantDomainUrl,
  normalizeStoreWebsiteProfile,
  safeExternalUrl,
} from "@/lib/store-website";

function absoluteImageUrl(value?: string | null) {
  if (!value) {
    return absoluteUrl("/assets/ai-commerce-dashboard.webp");
  }

  try {
    return new URL(value, absoluteUrl("/")).toString();
  } catch {
    return absoluteUrl("/assets/ai-commerce-dashboard.webp");
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;

  const normalizedLocale =
    locale === "en" ? "en" : "ar";

  const decodedSlug = decodeURIComponent(slug);

  const store =
    await getPublicStoreSeo(decodedSlug);

  if (!store) {
    return {
      title:
        normalizedLocale === "ar"
          ? "المتجر | Tijvorya"
          : "Store | Tijvorya",

      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const storeName =
    normalizedLocale === "ar"
      ? store.name
      : store.nameEn || store.name;

  const rawDescription =
    normalizedLocale === "ar"
      ? store.description
      : store.descriptionEn;

  const description = shortDescription(
    rawDescription,
    normalizedLocale === "ar"
      ? `اكتشف منتجات ${storeName} وتسوق مباشرة عبر Tijvorya.`
      : `Discover products from ${storeName} and shop directly on Tijvorya.`
  );

  const storeUrl = merchantDomainUrl(
    store.slug,
    normalizedLocale
  );

  const image = absoluteImageUrl(
    store.cover || store.logo
  );

  const title = `${storeName} | Tijvorya`;

  return {
    title,
    description,

    alternates: {
      canonical: storeUrl,

      languages: {
        ar: merchantDomainUrl(
          store.slug,
          "ar"
        ),

        en: merchantDomainUrl(
          store.slug,
          "en"
        ),

        "x-default": merchantDomainUrl(
          store.slug,
          "ar"
        ),
      },
    },

    openGraph: {
      type: "website",

      title,

      description,

      url: storeUrl,

      siteName: "Tijvorya",

      locale:
        normalizedLocale === "ar"
          ? "ar_PS"
          : "en_US",

      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: storeName,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",

      title,

      description,

      images: [image],
    },

    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;

  params: Promise<{
    locale: string;
    slug: string;
  }>;
}) {
  const { locale, slug } = await params;

  const normalizedLocale =
    locale === "en" ? "en" : "ar";

  const store = await getPublicStoreSeo(
    decodeURIComponent(slug)
  );

  const website = store
    ? normalizeStoreWebsiteProfile(store.website)
    : undefined;

  const storeUrl = store
    ? merchantDomainUrl(
        store.slug,
        normalizedLocale
      )
    : undefined;

  const sameAs = website
    ? [
        safeExternalUrl(website.instagram),
        safeExternalUrl(website.facebook),
        safeExternalUrl(website.tiktok),
      ].filter((value): value is string => Boolean(value))
    : [];

  const data = store
    ? {
        "@context":
          "https://schema.org",

        "@type": "Store",

        "@id": storeUrl,

        name:
          normalizedLocale === "en"
            ? store.nameEn || store.name
            : store.name,

        description: shortDescription(
          normalizedLocale === "en"
            ? store.descriptionEn
            : store.description,

          store.name
        ),

        image: absoluteImageUrl(
          store.cover || store.logo
        ),

        logo: absoluteImageUrl(
          store.logo
        ),

        url: storeUrl,

        telephone: store.phone || undefined,

        email: website?.businessEmail || undefined,

        identifier: website?.registrationNumber || undefined,

        sameAs: sameAs.length > 0 ? sameAs : undefined,

        address: store.city
          ? {
              "@type":
                "PostalAddress",

              addressLocality:
                store.city,
            }
          : undefined,

        additionalProperty: [
          {
            "@type": "PropertyValue",
            name: "verified",
            value: Boolean(store.verified),
          },
        ],
      }
    : null;

  return (
    <>
      {data && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              data
            ).replace(
              /</g,
              "\\u003c"
            ),
          }}
        />
      )}

      {children}
    </>
  );
}