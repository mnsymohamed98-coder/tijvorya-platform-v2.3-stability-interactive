import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppProvider } from "@/providers/app-provider";
import { normalizeLocale, supportedLocales } from "@/lib/i18n";
import { absoluteUrl, localeSeo } from "@/lib/site";

export function generateStaticParams() { return supportedLocales.map((locale) => ({ locale })); }

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!supportedLocales.includes(rawLocale as "ar" | "en")) return {};
  const locale = normalizeLocale(rawLocale);
  const seo = localeSeo[locale];
  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: absoluteUrl(`/${locale}`),
      languages: {
        ar: absoluteUrl("/ar"),
        en: absoluteUrl("/en"),
        "x-default": absoluteUrl("/ar"),
      },
    },
    openGraph: {
      type: "website",
      locale: locale === "ar" ? "ar_PS" : "en_US",
      alternateLocale: locale === "ar" ? ["en_US"] : ["ar_PS"],
      url: absoluteUrl(`/${locale}`),
      siteName: "Tijvorya",
      title: seo.title,
      description: seo.description,
      images: [{ url: absoluteUrl("/assets/ai-commerce-dashboard.webp"), width: 1200, height: 630, alt: "Tijvorya social commerce platform" }],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: [absoluteUrl("/assets/ai-commerce-dashboard.webp")],
    },
  };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!supportedLocales.includes(rawLocale as "ar" | "en")) notFound();
  const locale = normalizeLocale(rawLocale);
  return <div lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className={`locale-${locale}`}><AppProvider locale={locale}>{children}</AppProvider></div>;
}
