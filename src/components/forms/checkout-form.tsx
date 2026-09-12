"use client";

import { Check, Copy, LoaderCircle, MapPin, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MediaUploader } from "./media-uploader";
import { useApp } from "@/providers/app-provider";
import { DELIVERY_ZONES, deliveryZoneLabel } from "@/lib/store-website";
import { formatMoney } from "@/lib/utils";
import type { DeliveryZone, PaymentMethod, Store } from "@/types";

const TRANSFER_NUMBER = "0567954507";
const TRANSFER_NAME = "محمد منسي";

function checkoutErrorMessage(error: unknown, locale: "ar" | "en") {
  const value = error instanceof Error ? error.message : String(error ?? "");
  const messages: Record<string, [string, string]> = {
    INVALID_CUSTOMER_NAME: ["تحقق من الاسم الكامل.", "Check the full name."],
    INVALID_PHONE: ["تحقق من رقم الهاتف.", "Check the phone number."],
    INVALID_ADDRESS: ["أدخل عنوانًا أكثر تفصيلًا.", "Enter a more detailed address."],
    NOTES_TOO_LONG: ["الملاحظات طويلة جدًا.", "The notes are too long."],
    INVALID_PAYMENT_METHOD: ["اختر طريقة الدفع.", "Choose a payment method."],
    INVALID_DELIVERY_ZONE: ["اختر منطقة التوصيل.", "Choose a delivery area."],
    PAYMENT_PROOF_REQUIRED: ["أرفق صورة إشعار التحويل.", "Attach a screenshot of the transfer receipt."],
    INVALID_CART: ["السلة غير صالحة. حدّث الصفحة وحاول مجددًا.", "The cart is invalid. Refresh and try again."],
    PRODUCT_UNAVAILABLE: ["أحد المنتجات لم يعد متاحًا.", "One of the products is no longer available."],
    INSUFFICIENT_STOCK: ["الكمية المطلوبة لم تعد متوفرة.", "The requested quantity is no longer in stock."],
    INVALID_VARIANT: ["الخيار المحدد للمنتج لم يعد متاحًا.", "The selected product option is no longer available."],
    MULTI_STORE_CART: ["يجب أن يحتوي الطلب على منتجات من متجر واحد.", "An order can contain products from one store only."],
  };
  const match = Object.entries(messages).find(([code]) => value.includes(code));
  if (match) return match[1][locale === "ar" ? 0 : 1];
  return locale === "ar" ? "تعذر تأكيد الطلب حاليًا. حاول مرة أخرى." : "Unable to place the order right now. Please try again.";
}

export function CheckoutForm({ zone, onZoneChange, store }: { zone: DeliveryZone | ""; onZoneChange: (zone: DeliveryZone) => void; store?: Store }) {
  const { locale, cart, currentUser, createOrder, toast } = useApp();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [proofUrl, setProofUrl] = useState("");
  const [copied, setCopied] = useState(false);

  async function copyNumber() {
    try {
      await navigator.clipboard.writeText(TRANSFER_NUMBER);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be blocked - the number is still visible to copy manually.
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cart.length) { router.push(`/${locale}/cart`); return; }
    if (!zone) { toast(locale === "ar" ? "اختر منطقة التوصيل" : "Choose a delivery area", "error"); return; }
    if (!method) { toast(locale === "ar" ? "اختر طريقة الدفع" : "Choose a payment method", "error"); return; }
    if (!proofUrl) { toast(locale === "ar" ? "أرفق صورة إشعار التحويل قبل تأكيد الطلب" : "Attach a screenshot of the transfer receipt before confirming", "error"); return; }
    const form = new FormData(event.currentTarget);
    setLoading(true);
    try {
      const order = await createOrder({
        customerName: String(form.get("customerName") ?? "").trim(),
        phone: String(form.get("phone") ?? "").trim(),
        address: String(form.get("address") ?? "").trim(),
        notes: String(form.get("notes") ?? "").trim() || undefined,
        paymentMethod: method,
        paymentProofUrl: proofUrl,
        deliveryZone: zone || undefined,
      });
      router.push(`/${locale}/order/${order.id}`);
    } catch (error) {
      toast(checkoutErrorMessage(error, locale), "error");
    } finally {
      setLoading(false);
    }
  }

  return <form className="checkout-form" onSubmit={submit} aria-busy={loading}>
    <div className="checkout-section">
      <span className="eyebrow">DELIVERY DETAILS</span>
      <h2>{locale === "ar" ? "بيانات استلام الطلب" : "Delivery information"}</h2>
      <div className="form-grid two">
        <label className="field"><span>{locale === "ar" ? "الاسم الكامل" : "Full name"}</span><input name="customerName" required minLength={2} maxLength={120} autoComplete="name" defaultValue={currentUser?.fullName} /></label>
        <label className="field"><span>{locale === "ar" ? "رقم الهاتف" : "Phone number"}</span><input name="phone" type="tel" required minLength={7} maxLength={30} autoComplete="tel" defaultValue={currentUser?.phone} pattern="[0-9+() -]{7,30}" inputMode="tel" /></label>
      </div>
      <label className="field"><span>{locale === "ar" ? "العنوان بالتفصيل" : "Full address"}</span><textarea name="address" rows={4} required minLength={8} maxLength={500} autoComplete="street-address" placeholder={locale === "ar" ? "المدينة، الحي، الشارع، أقرب نقطة دالة" : "City, area, street and nearest landmark"} /></label>
      <div className="field">
        <span>{locale === "ar" ? "منطقة التوصيل" : "Delivery area"}</span>
        <div className="delivery-zone-grid">
          {DELIVERY_ZONES.map((item) => <button type="button" key={item} className={`delivery-zone-option ${zone === item ? "is-active" : ""}`} onClick={() => onZoneChange(item)} aria-pressed={zone === item}>
            <MapPin />
            <span>{deliveryZoneLabel(item, locale)}</span>
            <strong>{formatMoney(Math.max(0, store?.deliveryFees?.[item] ?? 0), locale)}</strong>
          </button>)}
        </div>
      </div>
      <label className="field"><span>{locale === "ar" ? "ملاحظات اختيارية" : "Optional notes"}</span><textarea name="notes" rows={3} maxLength={1000} /></label>
    </div>

    <div className="checkout-section">
      <span className="eyebrow">PAYMENT</span>
      <h2>{locale === "ar" ? "طريقة الدفع" : "Payment method"}</h2>
      <p className="field-hint">{locale === "ar" ? "حوّل المبلغ إلى الرقم أدناه، ثم أرفق صورة إشعار التحويل لتأكيد الطلب." : "Transfer the amount to the number below, then attach a screenshot of the transfer receipt to confirm the order."}</p>

      <div className="payment-option-grid">
        <button type="button" className={`payment-option ${method === "bank_transfer" ? "is-active" : ""}`} onClick={() => setMethod("bank_transfer")}>
          <span className="payment-option-icon"><Image src="/assets/payments/bank-of-palestine.png" alt="" width={38} height={38} /></span>
          <span className="payment-option-copy"><strong>{locale === "ar" ? "تحويل بنكي" : "Bank transfer"}</strong><span>{locale === "ar" ? "بنك فلسطين" : "Bank of Palestine"}</span></span>
          {method === "bank_transfer" && <Check className="payment-option-check" />}
        </button>
        <button type="button" className={`payment-option ${method === "palpay" ? "is-active" : ""}`} onClick={() => setMethod("palpay")}>
          <span className="payment-option-icon"><Image src="/assets/payments/palpay.png" alt="" width={38} height={38} /></span>
          <span className="payment-option-copy"><strong>{locale === "ar" ? "محفظة PalPay" : "PalPay wallet"}</strong><span>{locale === "ar" ? "دفع فوري عبر المحفظة" : "Instant wallet payment"}</span></span>
          {method === "palpay" && <Check className="payment-option-check" />}
        </button>
      </div>

      <div className="payment-transfer-details">
        <div><span>{locale === "ar" ? "حوّل إلى" : "Transfer to"}</span><strong dir="ltr">{TRANSFER_NUMBER}</strong></div>
        <div><span>{locale === "ar" ? "باسم" : "Account name"}</span><strong>{TRANSFER_NAME}</strong></div>
        <button type="button" className="button button-ghost" onClick={copyNumber}><Copy />{copied ? (locale === "ar" ? "تم النسخ" : "Copied") : (locale === "ar" ? "نسخ الرقم" : "Copy number")}</button>
      </div>

      <MediaUploader resourceType="image" folder="tijvorya/payments" value={proofUrl} onChange={setProofUrl} maxMB={8} label={locale === "ar" ? "صورة إشعار التحويل" : "Transfer receipt screenshot"} />

      <p className="payment-verify-note"><ShieldCheck />{locale === "ar" ? "سيتم التأكد من عملية التحويل والتواصل معك في أقرب وقت ممكن." : "We'll verify the transfer and get in touch with you as soon as possible."}</p>
    </div>

    <button type="submit" className="button button-dark button-block button-large" disabled={loading}>{loading && <LoaderCircle className="spin" />}{locale === "ar" ? "تأكيد الطلب" : "Place order"}</button>
  </form>;
}
