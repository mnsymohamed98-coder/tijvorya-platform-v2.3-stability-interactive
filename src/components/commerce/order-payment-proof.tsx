"use client";

import { PersistentImage, usePersistentMediaUrl } from "@/components/ui/persistent-media";
import type { PaymentMethod } from "@/types";

const PAYMENT_LABELS: Record<PaymentMethod, [string, string]> = {
  bank_transfer: ["تحويل بنكي", "Bank transfer"],
  palpay: ["PalPay", "PalPay"],
};

export function OrderPaymentProof({ url, method, locale }: { url?: string; method?: PaymentMethod; locale: "ar" | "en" }) {
  const resolvedUrl = usePersistentMediaUrl(url);
  if (!url) return <small className="muted">{locale === "ar" ? "لا يوجد" : "None"}</small>;
  return <a className="order-payment-proof" href={resolvedUrl || undefined} target="_blank" rel="noopener noreferrer">
    <PersistentImage className="order-payment-proof-thumb" src={url} alt="" width={44} height={44} />
    <small>{method ? PAYMENT_LABELS[method][locale === "ar" ? 0 : 1] : ""}</small>
  </a>;
}
