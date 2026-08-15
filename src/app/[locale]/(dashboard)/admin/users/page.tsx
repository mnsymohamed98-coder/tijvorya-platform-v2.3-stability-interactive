"use client";

import { Ban, CheckCircle2, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { adminRoleLabel } from "@/lib/admin-permissions";
import { useApp } from "@/providers/app-provider";
import type { AdminRole, UserRole } from "@/types";

const roles: UserRole[] = ["customer", "merchant", "influencer"];
const adminRoles: AdminRole[] = ["super_admin", "content_moderator", "store_manager", "customer_support", "finance_manager"];

export default function Page() {
  const { locale, currentUser, users, setUserRole, setAdminRole, setUserStatus } = useApp();
  const canManageRoles = currentUser?.adminRole === "super_admin";
  const canManageStatus = canManageRoles || currentUser?.adminRole === "customer_support";
  return <>
    <PageHeader eyebrow="IDENTITIES & ACCESS" title={locale === "ar" ? "المستخدمون والصلاحيات" : "Users and permissions"} text={locale === "ar" ? "إدارة حسابات العملاء والتجار، وتوزيع صلاحيات الموظفين الإداريين وفق مبدأ أقل صلاحية لازمة." : "Manage customer and merchant accounts and assign staff access using least-privilege controls."} />
    <section className="editor-card"><div className="table-wrap"><table><thead><tr><th>{locale === "ar" ? "المستخدم" : "User"}</th><th>{locale === "ar" ? "البريد" : "Email"}</th><th>{locale === "ar" ? "الدور" : "Role"}</th><th>{locale === "ar" ? "الصلاحية الإدارية" : "Admin permission"}</th><th>{locale === "ar" ? "الحالة" : "Status"}</th><th>{locale === "ar" ? "الإجراء" : "Action"}</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}>
      <td><div className="user-cell"><span className="avatar">{user.avatar}</span><strong>{user.fullName}</strong></div></td>
      <td>{user.email}</td>
      <td>{user.role === "admin" ? <span className="admin-role-pill"><ShieldCheck /> admin</span> : canManageRoles ? <select className="admin-inline-select" value={user.role} onChange={(event) => setUserRole(user.id, event.target.value as UserRole)}>{roles.map((role) => <option key={role} value={role}>{role}</option>)}</select> : <span>{user.role}</span>}</td>
      <td>{user.role === "admin" ? (canManageRoles && user.id !== currentUser?.id ? <select className="admin-inline-select" value={user.adminRole ?? ""} onChange={(event) => setAdminRole(user.id, event.target.value as AdminRole)}><option value="" disabled>{locale === "ar" ? "غير معيّن" : "Unassigned"}</option>{adminRoles.map((role) => <option key={role} value={role}>{adminRoleLabel(role, locale)}</option>)}</select> : <span className="admin-role-pill">{adminRoleLabel(user.adminRole, locale)}</span>) : <span className="muted">—</span>}</td>
      <td><span className={`status-pill status-${user.status ?? "active"}`}>{user.status ?? "active"}</span></td>
      <td>{user.role === "admin" ? <small>{locale === "ar" ? "هوية تشغيل محمية" : "Protected staff identity"}</small> : canManageStatus ? <button type="button" className="icon-button" aria-label={user.status === "suspended" ? (locale === "ar" ? "تفعيل الحساب" : "Activate account") : (locale === "ar" ? "تعليق الحساب" : "Suspend account")} onClick={() => setUserStatus(user.id, user.status === "suspended" ? "active" : "suspended")}>{user.status === "suspended" ? <CheckCircle2 /> : <Ban />}</button> : <small>{locale === "ar" ? "عرض فقط" : "Read only"}</small>}</td>
    </tr>)}</tbody></table></div></section>
  </>;
}
