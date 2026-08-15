"use client";

import Link from "next/link";
import { Store } from "lucide-react";
import { useApp } from "@/providers/app-provider";

export function StorefrontNotFound() {
  const { locale } = useApp();
  return <main className="merchant-site-missing"><div><Store /><h1>{locale === "ar" ? "المتجر غير موجود" : "Store not found"}</h1><p>{locale === "ar" ? "قد يكون الرابط غير صحيح أو أن المتجر غير متاح حاليًا." : "The link may be incorrect or the store is currently unavailable."}</p><Link className="button button-dark" href={`/${locale}/marketplace`}>{locale === "ar" ? "العودة إلى السوق" : "Back to marketplace"}</Link></div></main>;
}
