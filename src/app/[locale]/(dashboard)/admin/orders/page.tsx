"use client";

import { PageHeader } from "@/components/dashboard/page-header";
import { StatusPill } from "@/components/ui/status-pill";
import { useApp } from "@/providers/app-provider";
import type { OrderStatus } from "@/types";

const statuses: OrderStatus[] = ["pending", "accepted", "preparing", "ready", "out_for_delivery", "completed", "cancelled"];

export default function Page() {
  const { locale, orders, stores, updateOrderStatus } = useApp();
  return <><PageHeader eyebrow="ORDER OVERSIGHT" title={locale === "ar" ? "مراقبة الطلبات" : "Order oversight"} text={locale === "ar" ? "رؤية جميع طلبات المنصة وتعديل الحالة عند الحاجة التشغيلية." : "View all platform orders and adjust status when operationally required."} /><article className="editor-card"><div className="table-wrap"><table><thead><tr><th>ID</th><th>{locale === "ar" ? "المتجر" : "Store"}</th><th>{locale === "ar" ? "العميل" : "Customer"}</th><th>{locale === "ar" ? "الإجمالي" : "Total"}</th><th>{locale === "ar" ? "الحالة" : "Status"}</th></tr></thead><tbody>{orders.map((order) => { const store = stores.find((item) => item.id === order.storeId); return <tr key={order.id}><td>{order.id}</td><td>{store ? (locale === "ar" ? store.name : store.nameEn) : order.storeId}</td><td>{order.customerName}<small>{order.phone}</small></td><td>{order.total}</td><td><div className="status-editor"><StatusPill status={order.status} locale={locale} /><select value={order.status} onChange={(event) => updateOrderStatus(order.id, event.target.value as OrderStatus)}>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></div></td></tr>; })}</tbody></table></div></article></>;
}
