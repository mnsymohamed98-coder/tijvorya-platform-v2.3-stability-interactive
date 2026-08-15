import type { OrderStatus, ProductStatus, ReelStatus, StoreStatus } from "@/types";
const labels: Record<string, { ar: string; en: string }> = {
  active: { ar: "نشط", en: "Active" }, draft: { ar: "مسودة", en: "Draft" }, archived: { ar: "مؤرشف", en: "Archived" },
  pending: { ar: "قيد المراجعة", en: "Pending" }, approved: { ar: "مقبول", en: "Approved" }, rejected: { ar: "مرفوض", en: "Rejected" },
  accepted: { ar: "مقبول", en: "Accepted" }, preparing: { ar: "قيد التجهيز", en: "Preparing" }, ready: { ar: "جاهز", en: "Ready" },
  out_for_delivery: { ar: "خرج للتوصيل", en: "Out for delivery" }, completed: { ar: "مكتمل", en: "Completed" }, cancelled: { ar: "ملغي", en: "Cancelled" }, suspended: { ar: "موقوف", en: "Suspended" },
};
export function StatusPill({ status, locale }: { status: OrderStatus | ProductStatus | ReelStatus | StoreStatus; locale: "ar" | "en" }) {
  return <span className={`status-pill status-${status}`}>{labels[status]?.[locale] ?? status}</span>;
}
