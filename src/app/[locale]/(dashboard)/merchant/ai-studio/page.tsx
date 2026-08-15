"use client";

import Link from "next/link";
import { Bot, Boxes, Film, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { useApp } from "@/providers/app-provider";
import type { AIStatusResponse } from "@/types/ai";

export default function Page() {
  const { locale, platformSettings } = useApp();
  const [status, setStatus] = useState<AIStatusResponse | null>(null);
  useEffect(() => { fetch("/api/ai/status", { cache: "no-store" }).then((r) => r.json()).then(setStatus).catch(() => setStatus(null)); }, []);
  return <>
    <PageHeader eyebrow="TIJVORYA AI STUDIO" title={locale === "ar" ? "استوديو الذكاء الاصطناعي" : "AI Studio"} text={locale === "ar" ? "أدوات مساعدة لإنشاء وصف المنتجات وكابشن الريلز مع بقاء القرار والتحرير النهائي بيدك." : "Assisted tools for product copy and reel captions, with final editing and decisions remaining yours."} />
    <section className="ai-studio-hero"><div><span className={`ai-live-dot ${status?.mode ?? "unavailable"}`} /><small>{status?.mode === "live" ? (locale === "ar" ? `OpenAI متصل — ${status.model}` : `OpenAI connected — ${status.model}`) : status?.mode === "demo" ? (locale === "ar" ? "المولد المحلي الاحتياطي" : "Local fallback generator") : (locale === "ar" ? "غير متصل" : "Unavailable")}</small><h2>{locale === "ar" ? "أنشئ المحتوى، ثم راجعه وانشره." : "Generate, review, then publish."}</h2><p>{locale === "ar" ? "لا تقوم المنصة بالنشر تلقائيًا. تُدرج المقترحات داخل النماذج حتى تعدّلها قبل الحفظ أو إرسال الريلز للمراجعة." : "The platform never publishes automatically. Suggestions are inserted into forms for review before saving or submitting."}</p></div><Bot /></section>
    {!platformSettings.aiEnabled && <div className="inline-warning">{locale === "ar" ? "أوقفت إدارة المنصة أدوات الذكاء الاصطناعي حاليًا." : "Platform administration has disabled AI tools."}</div>}
    <div className="ai-tool-grid">
      <article><div className="ai-tool-icon"><Boxes /></div><span className="eyebrow">PRODUCT WRITER</span><h3>{locale === "ar" ? "كاتب وصف المنتجات" : "Product copy writer"}</h3><p>{locale === "ar" ? "ينشئ وصفًا عربيًا وإنجليزيًا انطلاقًا من اسم المنتج وتصنيفه ومعلوماته الفعلية." : "Creates Arabic and English copy from the product name, category and factual details."}</p><Link className="button button-dark" href={`/${locale}/merchant/products/new`}><Sparkles />{locale === "ar" ? "إنشاء منتج" : "Create product"}</Link></article>
      <article><div className="ai-tool-icon"><Film /></div><span className="eyebrow">REEL WRITER</span><h3>{locale === "ar" ? "كاتب كابشن الريلز" : "Reel caption writer"}</h3><p>{locale === "ar" ? "يقترح Hook وكابشن وهاشتاقات ودعوة شراء اعتمادًا على المنتج المرتبط." : "Suggests a hook, caption, hashtags and call to action from the linked product."}</p><Link className="button button-dark" href={`/${locale}/merchant/reels/new`}><Sparkles />{locale === "ar" ? "إنشاء ريلز" : "Create reel"}</Link></article>
      <article><div className="ai-tool-icon"><ShieldCheck /></div><span className="eyebrow">SAFETY CHECK</span><h3>{locale === "ar" ? "فحص قبل المراجعة" : "Pre-moderation check"}</h3><p>{locale === "ar" ? "يفحص الكابشن والغلاف المتاح قبل دخوله قائمة الإدارة، لكنه لا يستبدل قرار المراجع البشري." : "Checks the caption and available cover before the admin queue, without replacing human review."}</p><span className="secure-note">{platformSettings.aiModerationEnabled ? (locale === "ar" ? "مفعّل" : "Enabled") : (locale === "ar" ? "متوقف" : "Disabled")}</span></article>
    </div>
  </>;
}
