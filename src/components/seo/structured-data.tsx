import { absoluteUrl, localeSeo, siteConfig } from "@/lib/site";
import type { Locale } from "@/types";

export function HomeStructuredData({ locale }: { locale: Locale }) {
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
      logo: absoluteUrl("/assets/logo.svg"),
      description: localeSeo[locale].description,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteConfig.name,
      url: absoluteUrl(`/${locale}`),
      inLanguage: locale === "ar" ? "ar" : "en",
      potentialAction: {
        "@type": "SearchAction",
        target: `${absoluteUrl(`/${locale}/marketplace`)}?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ];

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
