"use client";

import Link from "next/link";
import { ShieldCheck, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import type { Locale } from "@/types";

// Cart and checkout intentionally skip PublicShell (full nav + footer): a
// customer confirming an order shouldn't be one tap away from wandering
// back into the marketplace, pricing or reels. Just the brand, a trust
// signal and an explicit way out.
export function CheckoutShell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <div className="checkout-shell">
    <header className="checkout-topbar">
      <Logo locale={locale} compact />
      <span className="checkout-secure-badge"><ShieldCheck /><span>{locale === "ar" ? "طلب آمن وموثّق" : "Secure checkout"}</span></span>
      <Link className="checkout-exit" href={`/${locale}/marketplace`} aria-label={locale === "ar" ? "متابعة التسوق" : "Continue shopping"}><X /></Link>
    </header>
    <main className="checkout-main">{children}</main>
  </div>;
}
