"use client";

import Link from "next/link";
import { CheckCircle2, Circle, PackageCheck, Truck } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { CheckoutShell } from "@/components/layout/checkout-shell";
import { StatusPill } from "@/components/ui/status-pill";
import { useApp } from "@/providers/app-provider";
import { formatMoney } from "@/lib/utils";
import { deliveryZoneLabel, whatsappHref } from "@/lib/store-website";
import { WhatsAppBrandIcon } from "@/components/ui/social-brand-icons";
import type { Locale, Order, Product } from "@/types";

const sequence = ["pending", "accepted", "preparing", "ready", "out_for_delivery", "completed"] as const;

function buildWhatsAppOrderMessage(order: Order, locale: Locale, products: Product[]) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const ar = locale === "ar";
  const productImageUrls = order.items
    .map((item) => products.find((entry) => entry.id === item.productId)?.image)
    .filter((image): image is string => Boolean(image))
    .map((image) => (image.startsWith("http") ? image : `${origin}${image}`));

  const lines = [ar ? `مرحباً، أكدت طلب رقم ${order.id} على تيجفوريا:` : `Hi, I just placed order ${order.id} on Tijvorya:`, ""];

  // Links first, exactly as requested - the receipt link alongside the
  // product photo(s) - then the structured data as its own block.
  lines.push(ar ? "🔗 الروابط" : "🔗 Links");
  productImageUrls.forEach((url, index) => {
    const label = productImageUrls.length > 1
      ? (ar ? `صورة المنتج ${index + 1}` : `Product photo ${index + 1}`)
      : (ar ? "صورة المنتج" : "Product photo");
    lines.push(`${label}: ${url}`);
  });
  if (order.paymentProofUrl) lines.push(`${ar ? "صورة إشعار التحويل" : "Transfer receipt"}: ${order.paymentProofUrl}`);
  lines.push("");

  lines.push(ar ? "📋 بيانات الطلب" : "📋 Order details");
  lines.push("```");
  order.items.forEach((item) => {
    const variant = item.variant ? ` · ${item.variant}` : "";
    lines.push(`${item.name}${variant}`);
    lines.push(`${ar ? "الكمية" : "Qty"}: ${item.quantity}  |  ${ar ? "السعر" : "Price"}: ${formatMoney(item.unitPrice * item.quantity, locale)}`);
  });
  lines.push("------------------------");
  if (order.deliveryZone) lines.push(`${ar ? "منطقة التوصيل" : "Delivery area"}: ${deliveryZoneLabel(order.deliveryZone, locale)}`);
  lines.push(`${ar ? "الإجمالي" : "Total"}: ${formatMoney(order.total, locale)}`);
  lines.push(`${ar ? "الاسم" : "Name"}: ${order.customerName}`);
  lines.push(`${ar ? "الهاتف" : "Phone"}: ${order.phone}`);
  lines.push(`${ar ? "العنوان" : "Address"}: ${order.address}`);
  if (order.notes) lines.push(`${ar ? "ملاحظات" : "Notes"}: ${order.notes}`);
  lines.push("```");

  lines.push("");
  lines.push(ar ? "بانتظار تأكيدكم لإتمام الدفع، شكراً." : "Waiting for your confirmation to complete payment, thanks.");
  return lines.join("\n");
}

export default function OrderPage() {
  const params = useParams<{ id: string }>();
  const { locale, orders, stores, products } = useApp();
  const order = orders.find((item) => item.id === decodeURIComponent(params.id));
  const store = stores.find((item) => item.id === order?.storeId);
  const handedOff = useRef(false);

  // The order is really a handoff to the merchant, not a self-service
  // checkout - once it lands, send the customer straight to the merchant's
  // WhatsApp (pre-filled with the order and product photos) to actually
  // confirm and pay, instead of leaving them stranded on a tracking page.
  useEffect(() => {
    if (handedOff.current || !order || !store?.whatsapp) return;
    handedOff.current = true;
    const href = whatsappHref(store.whatsapp, buildWhatsAppOrderMessage(order, locale, products));
    if (href) window.location.href = href;
  }, [order, store, locale, products]);

  if (!order) {
    return <CheckoutShell locale={locale}><main className="centered-page"><div className="empty-state"><h1>{locale === "ar" ? "الطلب غير موجود" : "Order not found"}</h1><Link className="button button-dark" href={`/${locale}`}>{locale === "ar" ? "الرئيسية" : "Home"}</Link></div></main></CheckoutShell>;
  }

  const current = sequence.indexOf(order.status as typeof sequence[number]);
  const statusLabels = locale === "ar"
    ? { pending: "تم الاستلام", accepted: "قبله المتجر", preparing: "قيد التجهيز", ready: "جاهز للتوصيل", out_for_delivery: "خرج للتوصيل", completed: "تم التسليم" }
    : { pending: "Received", accepted: "Accepted", preparing: "Preparing", ready: "Ready", out_for_delivery: "Out for delivery", completed: "Delivered" };

  return <CheckoutShell locale={locale}>
    <section className="page-hero compact"><div className="container"><span className="eyebrow">ORDER {order.id}</span><h1>{locale === "ar" ? "تم استلام طلبك" : "Your order has been received"}</h1><StatusPill status={order.status} locale={locale} /></div></section>
    <section className="section container">
      <div className="order-detail-layout">
        <div className="editor-card">
          <div className="card-head"><div><span className="eyebrow">TRACKING</span><h2>{locale === "ar" ? "مسار الطلب" : "Order journey"}</h2></div></div>
          <div className="order-timeline">{sequence.map((status, index) => <div key={status} className={index <= current ? "done" : ""}>{index <= current ? <CheckCircle2 /> : <Circle />}<span>{statusLabels[status]}</span></div>)}</div>
          {store?.whatsapp && <a className="button button-ghost order-message-link" href={whatsappHref(store.whatsapp, buildWhatsAppOrderMessage(order, locale, products))} target="_blank" rel="noopener noreferrer"><WhatsAppBrandIcon />{locale === "ar" ? "تواصل مع المتجر عبر واتساب بخصوص الطلب" : "Message store on WhatsApp about this order"}</a>}
        </div>
        <aside className="order-summary detail">
          <h3>{locale === "ar" ? "تفاصيل الطلب" : "Order details"}</h3>
          {order.items.map((item, index) => <div key={`${item.productId}-${index}`}><span>{item.name} × {item.quantity}{item.variant ? ` · ${item.variant}` : ""}</span><strong>{formatMoney(item.unitPrice * item.quantity, locale)}</strong></div>)}
          <div><span>{locale === "ar" ? "التوصيل" : "Delivery"}{order.deliveryZone ? ` · ${deliveryZoneLabel(order.deliveryZone, locale)}` : ""}</span><strong>{formatMoney(order.deliveryFee ?? 0, locale)}</strong></div>
          <div className="summary-total"><span>{locale === "ar" ? "الإجمالي" : "Total"}</span><strong>{formatMoney(order.total, locale)}</strong></div>
          <p><Truck />{order.address}</p><p><PackageCheck />{order.customerName} · {order.phone}</p>
        </aside>
      </div>
    </section>
  </CheckoutShell>;
}
