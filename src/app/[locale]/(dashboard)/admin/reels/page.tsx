"use client";

import { Check, Clock3, Eye, ListFilter, LoaderCircle, RotateCcw, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { PersistentImage, PersistentVideo } from "@/components/ui/persistent-media";
import { StatusPill } from "@/components/ui/status-pill";
import { useApp } from "@/providers/app-provider";
import type { Reel, ReelStatus } from "@/types";
import type { AIReelReview } from "@/types/ai";

const filters: ReelStatus[] = ["pending", "approved", "rejected", "draft"];

export default function Page() {
  const { locale, reels, products, stores, moderateReel, toast } = useApp();
  const [filter, setFilter] = useState<ReelStatus>("pending");
  const [selected, setSelected] = useState<Reel | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiReview, setAiReview] = useState<(AIReelReview & { mode?: "live" | "demo" }) | null>(null);
  const items = useMemo(() => reels.filter((reel) => reel.status === filter).sort((a, b) => Date.parse(b.submittedAt ?? b.createdAt) - Date.parse(a.submittedAt ?? a.createdAt)), [reels, filter]);

  async function approve(reel: Reel) {
    setBusy(true);
    try { await moderateReel(reel.id, "approved"); setSelected(null); }
    catch (error) { toast(error instanceof Error ? error.message : (locale === "ar" ? "تعذر اعتماد الريلز" : "Unable to approve reel"), "error"); }
    finally { setBusy(false); }
  }

  async function reject(reel: Reel) {
    setBusy(true);
    try { await moderateReel(reel.id, "rejected", { rejectionReason: reason }); setSelected(null); setReason(""); setAiReview(null); }
    catch (error) { toast(error instanceof Error ? error.message : (locale === "ar" ? "تعذر رفض الريلز" : "Unable to reject reel"), "error"); }
    finally { setBusy(false); }
  }

  async function runAIReview(reel: Reel) {
    const product = products.find((item) => item.id === reel.productId);
    const store = stores.find((item) => item.id === reel.storeId);
    setAiBusy(true);
    try {
      const response = await fetch("/api/ai/review-reel", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: product ? (locale === "ar" ? product.name : product.nameEn) : reel.productId,
          productDescription: product ? (locale === "ar" ? product.description : product.descriptionEn) : "",
          caption: locale === "ar" ? reel.caption : reel.captionEn,
          storeStatus: store?.status ?? "active", stock: product?.stock ?? 0, coverUrl: reel.cover,
        }),
      });
      const payload = await response.json() as { data?: AIReelReview; moderationFlagged?: boolean; mode?: "live" | "demo"; error?: string; errorEn?: string };
      if (!response.ok || !payload.data) throw new Error(locale === "ar" ? payload.error : payload.errorEn);
      setAiReview({ ...payload.data, moderationFlagged: Boolean(payload.moderationFlagged), mode: payload.mode });
      if (payload.data.recommendation === "reject" && !reason.trim()) setReason(locale === "ar" ? payload.data.suggestedRejectionReasonAr : payload.data.suggestedRejectionReasonEn);
    } catch (error) {
      setAiReview(null);
      toast(error instanceof Error && error.message ? error.message : (locale === "ar" ? "تعذر تنفيذ الفحص الذكي" : "AI review failed"), "error");
    } finally { setAiBusy(false); }
  }

  return <>
    <PageHeader eyebrow="CONTENT GOVERNANCE" title={locale === "ar" ? "مركز مراجعة الريلز" : "Reel moderation center"} text={locale === "ar" ? "قائمة خاصة بالإدارة لمعاينة الفيديو، التحقق من المنتج والمتجر، ثم الاعتماد أو الرفض مع سبب واضح." : "Admin-only queue to preview the video, verify product and store, then approve or reject with clear feedback."} />
    <div className="admin-filter-tabs" role="tablist"><span><ListFilter />{locale === "ar" ? "الحالة" : "Status"}</span>{filters.map((status) => <button key={status} className={filter === status ? "is-active" : ""} onClick={() => setFilter(status)}><StatusPill status={status} locale={locale} /><b>{reels.filter((reel) => reel.status === status).length}</b></button>)}</div>
    {items.length === 0 ? <div className="admin-empty"><Clock3 /><h3>{locale === "ar" ? "لا توجد عناصر في هذه القائمة" : "No items in this queue"}</h3><p>{locale === "ar" ? "عندما يرسل التاجر ريلز للمراجعة سيظهر هنا مباشرة." : "Merchant submissions will appear here immediately."}</p></div> : <div className="moderation-list">{items.map((reel) => {
      const product = products.find((item) => item.id === reel.productId);
      const store = stores.find((item) => item.id === reel.storeId);
      return <article className="moderation-row" key={reel.id}>
        <button className="moderation-thumb" onClick={() => { setSelected(reel); setReason(reel.rejectionReason ?? ""); setAiReview(null); }}><PersistentImage src={reel.cover} alt="" optimized sizes="130px" /><span><Eye /></span></button>
        <div className="moderation-summary"><div className="moderation-summary-head"><StatusPill status={reel.status} locale={locale} /><small>{new Date(reel.submittedAt ?? reel.createdAt).toLocaleString(locale === "ar" ? "ar-PS" : "en-US")}</small></div><h3>{product ? (locale === "ar" ? product.name : product.nameEn) : reel.productId}</h3><p>{locale === "ar" ? reel.caption : reel.captionEn}</p><div className="moderation-meta"><span>{locale === "ar" ? "المتجر:" : "Store:"} <strong>{store ? (locale === "ar" ? store.name : store.nameEn) : reel.storeId}</strong></span><span>{locale === "ar" ? "المعرّف:" : "ID:"} {reel.id}</span></div>{reel.rejectionReason && <div className="rejection-feedback"><strong>{locale === "ar" ? "سبب الرفض" : "Rejection reason"}</strong><p>{reel.rejectionReason}</p></div>}</div>
        <div className="moderation-row-actions"><button className="button button-secondary" onClick={() => { setSelected(reel); setReason(reel.rejectionReason ?? ""); setAiReview(null); }}><Eye />{locale === "ar" ? "معاينة" : "Preview"}</button>{reel.status !== "approved" && <button className="button approve" disabled={busy} onClick={() => approve(reel)}><Check />{locale === "ar" ? "اعتماد" : "Approve"}</button>}{reel.status !== "rejected" && <button className="button reject" disabled={busy} onClick={() => { setSelected(reel); setReason(""); }}><X />{locale === "ar" ? "رفض" : "Reject"}</button>}</div>
      </article>;
    })}</div>}

    {selected && <div className="admin-modal-backdrop" onMouseDown={() => setSelected(null)}><section className="admin-modal" onMouseDown={(event) => event.stopPropagation()}><header><div><span className="eyebrow">REEL REVIEW</span><h2>{locale === "ar" ? "معاينة واعتماد المحتوى" : "Preview and moderate content"}</h2></div><button className="icon-button" onClick={() => setSelected(null)}><X /></button></header><div className="admin-modal-grid"><div className="admin-video-preview"><PersistentVideo src={selected.videoUrl} poster={undefined} controls playsInline preload="metadata" /></div><div className="admin-review-panel">{(() => { const product = products.find((item) => item.id === selected.productId); const store = stores.find((item) => item.id === selected.storeId); return <><StatusPill status={selected.status} locale={locale} /><h3>{product ? (locale === "ar" ? product.name : product.nameEn) : selected.productId}</h3><p>{locale === "ar" ? selected.caption : selected.captionEn}</p><dl><div><dt>{locale === "ar" ? "المتجر" : "Store"}</dt><dd>{store ? (locale === "ar" ? store.name : store.nameEn) : selected.storeId}</dd></div><div><dt>{locale === "ar" ? "حالة المتجر" : "Store status"}</dt><dd>{store?.status ?? "active"}</dd></div><div><dt>{locale === "ar" ? "المنتج متوفر" : "Product available"}</dt><dd>{product?.stock ? `${product.stock}` : locale === "ar" ? "لا" : "No"}</dd></div></dl><label className="field"><span>{locale === "ar" ? "سبب الرفض أو الملاحظات" : "Rejection reason or feedback"}</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={5} placeholder={locale === "ar" ? "مثال: الفيديو لا يطابق المنتج، أو يحتوي معلومات سعر غير صحيحة." : "Example: video does not match the product or contains incorrect pricing."} /></label><button type="button" className="button button-ai admin-ai-review-button" disabled={aiBusy} onClick={() => runAIReview(selected)}>{aiBusy ? <LoaderCircle className="spin" /> : <Sparkles />}{locale === "ar" ? "فحص AI مساعد" : "AI assisted check"}</button>{aiReview && <div className={`ai-review-result ${aiReview.recommendation}`}><div className="ai-review-title"><Sparkles /><strong>{locale === "ar" ? "توصية مساعدة" : "Advisory recommendation"}</strong><span>{Math.round(aiReview.confidence * 100)}%</span></div><b>{aiReview.recommendation === "approve" ? (locale === "ar" ? "يميل للاعتماد" : "Leans approve") : aiReview.recommendation === "reject" ? (locale === "ar" ? "يميل للرفض" : "Leans reject") : (locale === "ar" ? "مراجعة بشرية مطلوبة" : "Manual review required")}</b><p>{locale === "ar" ? aiReview.summaryAr : aiReview.summaryEn}</p>{(locale === "ar" ? aiReview.issuesAr : aiReview.issuesEn).length > 0 && <ul>{(locale === "ar" ? aiReview.issuesAr : aiReview.issuesEn).map((issue) => <li key={issue}>{issue}</li>)}</ul>}<small>{locale === "ar" ? `الوضع: ${aiReview.mode === "live" ? "OpenAI" : "تجريبي"}. القرار النهائي للإدارة.` : `Mode: ${aiReview.mode === "live" ? "OpenAI" : "demo"}. Final decision remains with admin.`}</small></div>}<div className="admin-review-actions"><button className="button approve" disabled={busy} onClick={() => approve(selected)}><Check />{locale === "ar" ? "اعتماد ونشر" : "Approve and publish"}</button><button className="button reject" disabled={busy} onClick={() => reject(selected)}><X />{locale === "ar" ? "رفض وإرسال السبب" : "Reject with feedback"}</button>{selected.status !== "pending" && <button className="button button-ghost" onClick={() => moderateReel(selected.id, "pending")}><RotateCcw />{locale === "ar" ? "إعادة للمراجعة" : "Return to queue"}</button>}</div></>; })()}</div></div></section></div>}
  </>;
}
