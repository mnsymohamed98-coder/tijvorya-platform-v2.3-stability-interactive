"use client";

import { Ban, CheckCircle2, Copy, LoaderCircle, ShieldCheck, UserPlus } from "lucide-react";
import { FormEvent, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { adminRoleLabel } from "@/lib/admin-permissions";
import { whatsappHref } from "@/lib/store-website";
import { WhatsAppBrandIcon } from "@/components/ui/social-brand-icons";
import { useApp } from "@/providers/app-provider";
import type { AdminRole, UserRole } from "@/types";

const roles: UserRole[] = ["customer", "merchant", "influencer"];
const adminRoles: AdminRole[] = ["super_admin", "content_moderator", "store_manager", "customer_support", "finance_manager"];

export default function Page() {
  const { locale, currentUser, users, setUserRole, setAdminRole, setUserStatus, createMerchantAccount } = useApp();
  const canManageRoles = currentUser?.adminRole === "super_admin";
  const canManageStatus = canManageRoles || currentUser?.adminRole === "customer_support";

  const [newAccountRole, setNewAccountRole] = useState<"merchant" | "influencer">("merchant");
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<{ email: string; tempPassword: string; phone?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const fullName = String(form.get("fullName") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    setCreating(true);
    setCopied(false);
    try {
      const { email: createdEmail, tempPassword } = await createMerchantAccount({ fullName, email, phone: phone || undefined, role: newAccountRole });
      setResult({ email: createdEmail, tempPassword, phone: phone || undefined });
      event.currentTarget.reset();
      setNewAccountRole("merchant");
    } catch {
      // The provider already surfaced a toast for this.
    } finally {
      setCreating(false);
    }
  }

  const whatsappMessage = result
    ? (locale === "ar"
      ? `مرحباً، تم إنشاء حسابك على Tijvorya.\nالبريد الإلكتروني: ${result.email}\nكلمة المرور المؤقتة: ${result.tempPassword}\nرجاءً غيّرها بعد أول تسجيل دخول.`
      : `Hi, your Tijvorya account is ready.\nEmail: ${result.email}\nTemporary password: ${result.tempPassword}\nPlease change it after your first sign-in.`)
    : "";

  async function copyPassword() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.tempPassword);
      setCopied(true);
    } catch {
      // Clipboard access can be blocked - the password is still visible to copy manually.
    }
  }

  return <>
    <PageHeader eyebrow="IDENTITIES & ACCESS" title={locale === "ar" ? "المستخدمون والصلاحيات" : "Users and permissions"} text={locale === "ar" ? "إدارة حسابات العملاء والتجار، وتوزيع صلاحيات الموظفين الإداريين وفق مبدأ أقل صلاحية لازمة." : "Manage customer and merchant accounts and assign staff access using least-privilege controls."} />

    {canManageRoles && <section className="editor-card">
      <div className="card-head"><div><span className="eyebrow">PROVISION ACCOUNT</span><h3>{locale === "ar" ? "إنشاء حساب تاجر" : "Create a merchant account"}</h3></div><UserPlus /></div>
      <p className="field-hint">{locale === "ar" ? "التسجيل الذاتي للتجار متوقف حاليًا — أنشئ الحساب من هنا وشارك بيانات الدخول مع صاحبه." : "Merchant self-registration is currently off - create the account here and share the login details with them."}</p>
      <form className="form-grid two" onSubmit={submitCreate}>
        <label className="field"><span>{locale === "ar" ? "الاسم الكامل" : "Full name"}</span><input name="fullName" required /></label>
        <label className="field"><span>{locale === "ar" ? "البريد الإلكتروني" : "Email"}</span><input name="email" type="email" required /></label>
        <label className="field"><span>{locale === "ar" ? "الهاتف (اختياري)" : "Phone (optional)"}</span><input name="phone" type="tel" /></label>
        <label className="field"><span>{locale === "ar" ? "نوع الحساب" : "Account type"}</span><select value={newAccountRole} onChange={(event) => setNewAccountRole(event.target.value as "merchant" | "influencer")}><option value="merchant">{locale === "ar" ? "تاجر" : "Merchant"}</option><option value="influencer">{locale === "ar" ? "مؤثر" : "Influencer"}</option></select></label>
        <div className="form-row-between" style={{ gridColumn: "1/-1" }}><button type="submit" className="button button-dark" disabled={creating}>{creating ? <LoaderCircle className="spin" /> : <ShieldCheck />}{locale === "ar" ? "إنشاء الحساب" : "Create account"}</button></div>
      </form>
      {result && <div className="contact-status">
        <p><strong>{locale === "ar" ? "تم إنشاء الحساب." : "Account created."}</strong> {locale === "ar" ? "شارك بيانات الدخول التالية مع صاحب الحساب فورًا (لن تظهر كلمة المرور مرة أخرى):" : "Share these login details with the account holder now (the password won't be shown again):"}</p>
        <p dir="ltr"><strong>{result.email}</strong> · <code>{result.tempPassword}</code></p>
        <div className="form-row-between">
          <button type="button" className="button button-ghost" onClick={copyPassword}><Copy />{copied ? (locale === "ar" ? "تم النسخ" : "Copied") : (locale === "ar" ? "نسخ كلمة المرور" : "Copy password")}</button>
          {result.phone && <a className="button button-ghost" href={whatsappHref(result.phone, whatsappMessage)} target="_blank" rel="noopener noreferrer"><WhatsAppBrandIcon />{locale === "ar" ? "إرسال عبر واتساب" : "Send on WhatsApp"}</a>}
        </div>
      </div>}
    </section>}

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
