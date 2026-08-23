import type { Metadata, Viewport } from "next";
import { localeSeo, siteConfig } from "@/lib/site";
import { SiteInteractions } from "@/components/ui/site-interactions";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: localeSeo.ar.title, template: "%s | Tijvorya" },
  description: localeSeo.ar.description,
  applicationName: "Tijvorya",
  category: "ecommerce",
  icons: {
    icon: [
      { url: "/assets/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/assets/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/assets/favicon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/assets/favicon-180.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/assets/favicon-32.png",
  },
  manifest: "/manifest.webmanifest",
  robots: { index: true, follow: true },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#101828" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl" suppressHydrationWarning><body>{children}<SiteInteractions /></body></html>;
}
