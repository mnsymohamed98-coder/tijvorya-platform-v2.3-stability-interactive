"use client";

import { LoaderCircle, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/providers/app-provider";

function checkoutErrorMessage(error: unknown, locale: "ar" | "en") {
  const value = error instanceof Error ? error.message : String(error ?? "");
  const messages: Record<string, [string, string]> = {
    INVALID_CUSTOMER_NAME: ["تحقق من الاسم الكامل.", "Check the full name."],
    INVALID_PHONE: ["تحقق من رقم الهاتف.", "Check the phone number."],
    INVALID_ADDRESS: ["أدخل عنوانًا أكثر تفصيلًا.", "Enter a more detailed address."],
    NOTES_TOO_LONG: ["الملاحظات طويلة جدًا.", "The notes are too long."],
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

export function CheckoutForm() {
  const { locale, cart, currentUser, createOrder, toast } = useApp();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cart.length) { router.push(`/${locale}/cart`); return; }
    const form = new FormData(event.currentTarget);
    setLoading(true);
    try {
      const order = await createOrder({
        customerName: String(form.get("customerName") ?? "").trim(),
        phone: String(form.get("phone") ?? "").trim(),
        address: String(form.get("address") ?? "").trim(),
        notes: String(form.get("notes") ?? "").trim() || undefined,
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
      <label className="field"><span>{locale === "ar" ? "ملاحظات اختيارية" : "Optional notes"}</span><textarea name="notes" rows={3} maxLength={1000} /></label>
    </div>
    <div className="payment-method"><ShieldCheck /><div><strong>{locale === "ar" ? "الدفع عند الاستلام" : "Cash on delivery"}</strong><p>{locale === "ar" ? "يعاد التحقق من السعر والمخزون داخل قاعدة البيانات قبل إنشاء الطلب." : "Price and stock are revalidated in the database before the order is created."}</p></div><input type="radio" checked readOnly aria-label={locale === "ar" ? "الدفع عند الاستلام محدد" : "Cash on delivery selected"} /></div>
    <button type="submit" className="button button-dark button-block button-large" disabled={loading}>{loading && <LoaderCircle className="spin" />}{locale === "ar" ? "تأكيد الطلب" : "Place order"}</button>
  </form>;
}
