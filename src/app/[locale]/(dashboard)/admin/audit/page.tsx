"use client";

import { Activity, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { useApp } from "@/providers/app-provider";

export default function Page() {
  const { locale, auditLog, users } = useApp();
  return <>
    <PageHeader eyebrow="AUDIT & ACCOUNTABILITY" title={locale === "ar" ? "سجل النشاط الإداري" : "Administrative activity log"} text={locale === "ar" ? "سجل زمني للإجراءات الحساسة والتغييرات التشغيلية التي تمت داخل مركز التحكم." : "A chronological record of sensitive actions and operational changes made inside the control center."} />
    <section className="admin-security-banner"><ShieldCheck /><div><strong>{locale === "ar" ? "سجل غير قابل للتعديل من الواجهة" : "Interface-level immutable log"}</strong><p>{locale === "ar" ? "يُستخدم للمراجعة والمساءلة وتتبع القرارات الإدارية." : "Used for review, accountability and administrative decision tracing."}</p></div><span className="status-pill status-active">{auditLog.length} RECORDS</span></section>
    <div className="admin-audit-page-list">{auditLog.length ? auditLog.slice().sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).map((entry) => {
      const actor = users.find((user) => user.id === entry.actorId);
      return <article key={entry.id}><span className="admin-audit-icon"><Activity /></span><div><strong>{entry.details}</strong><small>{actor ? `${actor.fullName} · ${entry.action}` : entry.action} · {entry.targetId}</small></div><time>{new Date(entry.createdAt).toLocaleString(locale === "ar" ? "ar-PS" : "en-US")}</time></article>;
    }) : <div className="admin-empty"><Activity /><h3>{locale === "ar" ? "لا توجد إجراءات مسجلة" : "No recorded actions"}</h3><p>{locale === "ar" ? "ستظهر الإجراءات الحساسة هنا تلقائيًا." : "Sensitive actions will appear here automatically."}</p></div>}</div>
  </>;
}
