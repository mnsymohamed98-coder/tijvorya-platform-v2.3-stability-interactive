"use client";

import { LoaderCircle } from "lucide-react";
import { useApp } from "@/providers/app-provider";

export function StorefrontLoading() {
  const { locale } = useApp();
  return <main className="merchant-site-loading"><LoaderCircle className="spin" /><span>{locale === "ar" ? "جاري تجهيز المتجر..." : "Loading store..."}</span></main>;
}
