"use client";

import { Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusPill } from "@/components/ui/status-pill";
import { OrderPaymentProof } from "@/components/commerce/order-payment-proof";
import { useApp } from "@/providers/app-provider";
import { formatMoney } from "@/lib/utils";
import type { OrderStatus } from "@/types";

const statuses: OrderStatus[] = ["pending", "accepted", "preparing", "ready", "out_for_delivery", "completed", "cancelled"];

export default function Page() {
  const { locale, orders, stores, updateOrderStatus, deleteOrder } = useApp();
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOrders = normalizedQuery
    ? orders.filter((order) => {
        const store = stores.find((item) => item.id === order.storeId);
        return [order.id, order.customerName, order.phone, store?.name, store?.nameEn].some((value) => value?.toLowerCase().includes(normalizedQuery));
      })
    : orders;
  return <><PageHeader eyebrow="ORDER OVERSIGHT" title={locale === "ar" ? "مراقبة الطلبات" : "Order oversight"} text={locale === "ar" ? "رؤية جميع طلبات المنصة وتعديل الحالة عند الحاجة التشغيلية." : "View all platform orders and adjust status when operationally required."} actions={<label className="search-field"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={locale === "ar" ? "ابحث برقم الطلب أو اسم العميل" : "Search by order ID or customer"} aria-label={locale === "ar" ? "البحث في الطلبات" : "Search orders"} /></label>} /><article className="editor-card"><div className="table-wrap"><table><thead><tr><th>ID</th><th>{locale === "ar" ? "المتجر" : "Store"}</th><th>{locale === "ar" ? "العميل" : "Customer"}</th><th>{locale === "ar" ? "الإجمالي" : "Total"}</th><th>{locale === "ar" ? "الدفع" : "Payment"}</th><th>{locale === "ar" ? "الحالة" : "Status"}</th><th></th></tr></thead><tbody>{filteredOrders.map((order) => { const store = stores.find((item) => item.id === order.storeId); return <tr key={order.id}><td>{order.id}</td><td>{store ? (locale === "ar" ? store.name : store.nameEn) : order.storeId}</td><td>{order.customerName}<small>{order.phone}</small></td><td>{formatMoney(order.total, locale)}</td><td><OrderPaymentProof url={order.paymentProofUrl} method={order.paymentMethod} locale={locale} /></td><td><div className="status-editor"><StatusPill status={order.status} locale={locale} /><select value={order.status} onChange={(event) => updateOrderStatus(order.id, event.target.value as OrderStatus)}>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></div></td><td><button className="icon-button danger" onClick={() => confirm(locale === "ar" ? "حذف الطلب؟" : "Delete order?") && deleteOrder(order.id)}><Trash2 /></button></td></tr>; })}</tbody></table></div></article></>;
}
