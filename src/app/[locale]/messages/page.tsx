"use client";

import { MessagingWorkspace } from "@/components/messages/messaging-workspace";
import { PublicShell } from "@/components/layout/public-shell";
import { useApp } from "@/providers/app-provider";

export default function Page() {
  const { locale } = useApp();
  return <PublicShell locale={locale}><main className="section container customer-messages-page"><div className="section-head"><div><span className="eyebrow">TIJVORYA MESSAGES</span><h1>{locale === "ar" ? "رسائلي" : "My messages"}</h1><p>{locale === "ar" ? "تواصل آمن مع المتاجر حول المنتجات والطلبات." : "Secure conversations with stores about products and orders."}</p></div></div><MessagingWorkspace mode="customer" /></main></PublicShell>;
}
