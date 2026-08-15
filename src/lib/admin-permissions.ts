import type { AdminRole } from "@/types";

export type AdminSection =
  | "overview"
  | "reels"
  | "stores"
  | "products"
  | "orders"
  | "users"
  | "messages"
  | "reports"
  | "ai"
  | "audit"
  | "settings";

const access: Record<AdminRole, readonly AdminSection[]> = {
  super_admin: ["overview", "reels", "stores", "products", "orders", "users", "messages", "reports", "ai", "audit", "settings"],
  content_moderator: ["overview", "reels", "products", "reports", "ai", "audit"],
  store_manager: ["overview", "stores", "products", "orders", "reports", "audit"],
  customer_support: ["overview", "orders", "users", "messages", "reports", "audit"],
  finance_manager: ["overview", "orders", "reports", "audit"],
};

export function canAccessAdminSection(role: AdminRole | undefined, section: AdminSection) {
  return role ? access[role].includes(section) : false;
}

export function adminRoleLabel(role: AdminRole | undefined, locale: "ar" | "en") {
  const labels: Record<AdminRole, { ar: string; en: string }> = {
    super_admin: { ar: "المدير العام", en: "Super Admin" },
    content_moderator: { ar: "مراجع المحتوى", en: "Content Moderator" },
    store_manager: { ar: "مدير المتاجر", en: "Store Manager" },
    customer_support: { ar: "دعم العملاء", en: "Customer Support" },
    finance_manager: { ar: "المدير المالي", en: "Finance Manager" },
  };
  return role ? labels[role][locale] : (locale === "ar" ? "دور إداري غير معيّن" : "Unassigned admin role");
}

export function adminSectionFromPath(pathname: string): AdminSection {
  const segment = pathname.split("/").filter(Boolean)[2] ?? "";
  if (!segment) return "overview";
  if (["reels", "stores", "products", "orders", "users", "messages", "reports", "ai", "audit", "settings"].includes(segment)) {
    return segment as AdminSection;
  }
  return "overview";
}
