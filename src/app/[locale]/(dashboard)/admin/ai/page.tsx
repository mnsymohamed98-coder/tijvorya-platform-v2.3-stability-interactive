"use client";

import Link from "next/link";
import { Bot, CheckCircle2, CircleOff, Settings, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { useApp } from "@/providers/app-provider";
import type { AIStatusResponse } from "@/types/ai";

export default function Page() {
  const { locale, platformSettings } = useApp();
  const [status, setStatus] = useState<AIStatusResponse | null>(null);
  useEffect(() => { fetch("/api/ai/status", { cache: "no-store" }).then((r) => r.json()).then(setStatus).catch(() => setStatus(null)); }, []);
  return <>
    <PageHeader eyebrow="AI GOVERNANCE" title={locale === "ar" ? "مركز تحكم الذكاء الاصطناعي" : "AI control center"} text={locale === "ar" ? "حالة الاتصال، صلاحيات الأدوات، وسياسة إبقاء قرار النشر والاعتماد بيد الإنسان." : "Connection status, feature permissions and human-in-the-loop governance."} actions={<Link className="button button-dark" href={`/${locale}/admin/settings`}><Settings />{locale === "ar" ? "الإعدادات" : "Settings"}</Link>} />
    <section className="admin-security-banner"><Bot /><div><strong>{status?.mode === "live" ? (locale === "ar" ? "اتصال OpenAI فعّال" : "OpenAI connection active") : status?.mode === "demo" ? (locale === "ar" ? "مولد محلي احتياطي" : "Local fallback generator") : (locale === "ar" ? "OpenAI غير متصل" : "OpenAI not connected")}</strong><p>{status?.mode === "live" ? `${status.provider} / ${status.model}` : (locale === "ar" ? "أضف OPENAI_API_KEY في ملف البيئة أو إعدادات الاستضافة." : "Add OPENAI_API_KEY to server environment variables.")}</p></div>{status?.mode === "live" ? <CheckCircle2 /> : status?.mode === "demo" ? <Sparkles /> : <CircleOff />}</section>
    <div className="stats-grid ai-admin-stats"><article className="stat-card"><span className="stat-icon"><Bot /></span><small>{locale === "ar" ? "الحالة العامة" : "Master status"}</small><strong>{platformSettings.aiEnabled ? (locale === "ar" ? "مفعّل" : "Enabled") : (locale === "ar" ? "متوقف" : "Disabled")}</strong></article><article className="stat-card"><span className="stat-icon"><Sparkles /></span><small>{locale === "ar" ? "كاتب المنتجات" : "Product writer"}</small><strong>{platformSettings.aiProductWriterEnabled ? "ON" : "OFF"}</strong></article><article className="stat-card"><span className="stat-icon"><Sparkles /></span><small>{locale === "ar" ? "كاتب الريلز" : "Reel writer"}</small><strong>{platformSettings.aiReelWriterEnabled ? "ON" : "OFF"}</strong></article><article className="stat-card"><span className="stat-icon"><ShieldCheck /></span><small>{locale === "ar" ? "فحص السلامة" : "Safety check"}</small><strong>{platformSettings.aiModerationEnabled ? "ON" : "OFF"}</strong></article></div>
    <section className="editor-card"><div className="card-head"><div><span className="eyebrow">GOVERNANCE RULES</span><h3>{locale === "ar" ? "ضوابط التشغيل" : "Operating controls"}</h3></div></div><div className="ai-rule-list"><div><ShieldCheck /><span><strong>{locale === "ar" ? "لا نشر تلقائي" : "No automatic publishing"}</strong><small>{locale === "ar" ? "مخرجات AI تبقى مسودة حتى يعتمدها التاجر أو الإدارة." : "AI output remains a draft until merchant or admin action."}</small></span></div><div><ShieldCheck /><span><strong>{locale === "ar" ? "مراجعة بشرية للريلز" : "Human reel moderation"}</strong><small>{locale === "ar" ? "توصية AI في مركز المراجعة مساعدة وليست قرارًا." : "AI recommendations in moderation are advisory only."}</small></span></div><div><ShieldCheck /><span><strong>{locale === "ar" ? "المفتاح سري على الخادم" : "Server-side secret key"}</strong><small>{locale === "ar" ? "لا يُرسل مفتاح OpenAI إلى المتصفح أو المستخدمين." : "The OpenAI key is never sent to browsers or users."}</small></span></div></div></section>
  </>;
}
