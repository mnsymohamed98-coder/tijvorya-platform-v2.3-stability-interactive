"use client";

import Link from "next/link";
import { CheckCircle2, Circle, MessageCircle, PackageCheck, Truck } from "lucide-react";
import { useParams } from "next/navigation";
import { PublicShell } from "@/components/layout/public-shell";
import { StatusPill } from "@/components/ui/status-pill";
import { useApp } from "@/providers/app-provider";
import { formatMoney } from "@/lib/utils";

const sequence = ["pending", "accepted", "preparing", "ready", "out_for_delivery", "completed"] as const;

export default function OrderPage() {
  const params = useParams<{ id: string }>();
  const { locale, orders, stores, platformSettings } = useApp();
  const order = orders.find((item) => item.id === decodeURIComponent(params.id));

  if (!order) {
    return <PublicShell locale={locale}><main className="centered-page"><div className="empty-state"><h1>{locale === "ar" ? "الطلب غير موجود" : "Order not found"}</h1><Link className="button button-dark" href={`/${locale}`}>{locale === "ar" ? "الرئيسية" : "Home"}</Link></div></main></PublicShell>;
  }

  const current = sequence.indexOf(order.status as typeof sequence[number]);
  const store = stores.find((item) => item.id === order.storeId);
  const statusLabels = locale === "ar"
    ? { pending: "تم الاستلام", accepted: "قبله المتجر", preparing: "قيد التجهيز", ready: "جاهز للتوصيل", out_for_delivery: "خرج للتوصيل", completed: "تم التسليم" }
    : { pending: "Received", accepted: "Accepted", preparing: "Preparing", ready: "Ready", out_for_delivery: "Out for delivery", completed: "Delivered" };

  return <PublicShell locale={locale}>
    <section className="page-hero compact"><div className="container"><span className="eyebrow">ORDER {order.id}</span><h1>{locale === "ar" ? "تم استلام طلبك" : "Your order has been received"}</h1><StatusPill status={order.status} locale={locale} /></div></section>
    <section className="section container">
      <div className="order-detail-layout">
        <div className="editor-card">
          <div className="card-head"><div><span className="eyebrow">TRACKING</span><h2>{locale === "ar" ? "مسار الطلب" : "Order journey"}</h2></div></div>
          <div className="order-timeline">{sequence.map((status, index) => <div key={status} className={index <= current ? "done" : ""}>{index <= current ? <CheckCircle2 /> : <Circle />}<span>{statusLabels[status]}</span></div>)}</div>
          {platformSettings.messagingEnabled && store && <Link className="button button-ghost order-message-link" href={`/${locale}/messages?store=${encodeURIComponent(store.slug)}&order=${encodeURIComponent(order.id)}`}><MessageCircle />{locale === "ar" ? "مراسلة المتجر بخصوص الطلب" : "Message store about this order"}</Link>}
        </div>
        <aside className="order-summary detail">
          <h3>{locale === "ar" ? "تفاصيل الطلب" : "Order details"}</h3>
          {order.items.map((item, index) => <div key={`${item.productId}-${index}`}><span>{item.name} × {item.quantity}{item.variant ? ` · ${item.variant}` : ""}</span><strong>{formatMoney(item.unitPrice * item.quantity, locale)}</strong></div>)}
          <div><span>{locale === "ar" ? "التوصيل" : "Delivery"}</span><strong>{formatMoney(order.deliveryFee ?? 0, locale)}</strong></div>
          <div className="summary-total"><span>{locale === "ar" ? "الإجمالي" : "Total"}</span><strong>{formatMoney(order.total, locale)}</strong></div>
          <p><Truck />{order.address}</p><p><PackageCheck />{order.customerName} · {order.phone}</p>
        </aside>
      </div>
    </section>
  </PublicShell>;
}
