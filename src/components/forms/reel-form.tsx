"use client";

import { FileCheck2, LoaderCircle, Save, Send, ShieldCheck, Sparkles } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MediaUploader } from "./media-uploader";
import { useApp } from "@/providers/app-provider";
import { uid } from "@/lib/utils";
import type { Reel, ReelStatus } from "@/types";
import type { AIReelCopy, AIReelStrategy } from "@/types/ai";

export function ReelForm() {
  const { locale, stores, products, currentUser, saveReel, toast, platformSettings } = useApp();
  const router = useRouter();
  const merchantStore = useMemo(() => stores.find((store) => store.ownerId === currentUser?.id), [stores, currentUser]);
  const merchantProducts = products.filter((product) => product.storeId === merchantStore?.id && product.status === "active");
  const [productId, setProductId] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [cover, setCover] = useState("");
  const [caption, setCaption] = useState("");
  const [captionEn, setCaptionEn] = useState("");
  const [aiMode, setAiMode] = useState<"live" | "local fallback" | null>(null);
  const [strategy, setStrategy] = useState<AIReelStrategy | null>(null);
  const [generating, setGenerating] = useState(false);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState<ReelStatus | null>(null);
  const selectedProduct = merchantProducts.find((product) => product.id === productId);

  async function generateCaption() {
    if (!selectedProduct) { toast(locale === "ar" ? "اختر المنتج أولًا" : "Select a product first", "error"); return; }
    setGenerating(true);
    try {
      const response = await fetch("/api/ai/reel-copy", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName: selectedProduct.name, category: selectedProduct.category, description: selectedProduct.description, price: selectedProduct.price, tone: "premium" }),
      });
      const payload = await response.json() as { data?: AIReelCopy; mode?: "live" | "local fallback"; error?: string; errorEn?: string };
      if (!response.ok || !payload.data) throw new Error(locale === "ar" ? payload.error : payload.errorEn);
      const hashtags = payload.data.hashtags.join(" ");
      setCaption(`${payload.data.hookAr}\n${payload.data.captionAr}\n${payload.data.callToActionAr}\n${hashtags}`.slice(0, 300));
      setCaptionEn(`${payload.data.hookEn}\n${payload.data.captionEn}\n${payload.data.callToActionEn}\n${hashtags}`.slice(0, 300));
      setAiMode(payload.mode ?? "live");
      toast(locale === "ar" ? "تم إنشاء كابشن مقترح. راجعه قبل الإرسال." : "AI caption generated. Review it before submitting.");
    } catch (error) {
      toast(error instanceof Error && error.message ? error.message : (locale === "ar" ? "تعذر إنشاء الكابشن" : "Unable to generate caption"), "error");
    } finally { setGenerating(false); }
  }


  async function generateStrategy() {
    if (!selectedProduct) { toast(locale === "ar" ? "اختر المنتج أولًا" : "Select a product first", "error"); return; }
    setGenerating(true);
    try {
      const response = await fetch("/api/ai/reel-strategy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productName: selectedProduct.name, category: selectedProduct.category, description: selectedProduct.description, price: selectedProduct.price, imageCount: selectedProduct.images?.length || 1 }) });
      const payload = await response.json() as { data?: AIReelStrategy; mode?: "live" | "local fallback"; error?: string; errorEn?: string };
      if (!response.ok || !payload.data) throw new Error(locale === "ar" ? payload.error : payload.errorEn);
      setStrategy(payload.data);
      const hashtags = payload.data.hashtags.join(" ");
      setCaption(`${payload.data.hookAr}\n${payload.data.captionAr}\n${payload.data.callToActionAr}\n${hashtags}`.slice(0, 300));
      setCaptionEn(`${payload.data.hookEn}\n${payload.data.captionEn}\n${payload.data.callToActionEn}\n${hashtags}`.slice(0, 300));
      setAiMode(payload.mode ?? "live");
      toast(locale === "ar" ? "تم إنشاء استراتيجية الريلز وخطة المشاهد." : "Reel strategy and storyboard generated.");
    } catch (error) { toast(error instanceof Error ? error.message : (locale === "ar" ? "تعذر إنشاء الاستراتيجية" : "Unable to generate strategy"), "error"); }
    finally { setGenerating(false); }
  }

  async function moderateBeforeSubmit() {
    if (!platformSettings.aiEnabled || !platformSettings.aiModerationEnabled) return true;
    setChecking(true);
    try {
      const response = await fetch("/api/ai/moderate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `${caption}\n${captionEn}`, imageUrl: cover }),
      });
      const payload = await response.json() as { flagged?: boolean; categories?: string[]; error?: string; errorEn?: string };
      if (!response.ok) throw new Error(locale === "ar" ? payload.error : payload.errorEn);
      if (payload.flagged) {
        toast(locale === "ar" ? "أوقف الفحص الذكي الإرسال. راجع النص أو الغلاف قبل المتابعة." : "AI safety check blocked submission. Review the caption or cover.", "error");
        return false;
      }
      return true;
    } catch (error) {
      console.error(error);
      toast(locale === "ar" ? "تعذر فحص AI، لذلك سيُرسل الريلز إلى المراجعة البشرية دون نشر تلقائي." : "AI check was unavailable, so the reel will continue to human review without automatic publishing.");
      return true;
    } finally { setChecking(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const requestedStatus = (submitter?.value === "draft" ? "draft" : "pending") as ReelStatus;
    if (!merchantStore || !videoUrl) { toast(locale === "ar" ? "اختر فيديو صالحًا" : "Choose a valid video", "error"); return; }
    if (!selectedProduct) { toast(locale === "ar" ? "اختر منتجًا" : "Select a product", "error"); return; }
    if (requestedStatus === "pending" && !(await moderateBeforeSubmit())) return;
    setSaving(requestedStatus);
    try {
      const now = new Date().toISOString();
      const reel: Reel = {
        id: uid("reel"), storeId: merchantStore.id, productId,
        caption: caption.trim(), captionEn: captionEn.trim() || caption.trim(),
        videoUrl, cover: cover || selectedProduct.image || "/assets/reel-1.png",
        status: requestedStatus, views: 0, likes: 0, hashtags: strategy?.hashtags, bestPostTime: strategy?.bestPostTime, createdAt: now, submittedAt: requestedStatus === "pending" ? now : undefined,
      };
      await saveReel(reel);
      router.push(`/${locale}/merchant/reels`);
    } catch (error) { toast(error instanceof Error ? error.message : "Unable to save reel", "error"); }
    finally { setSaving(null); }
  }

  const writerAvailable = platformSettings.aiEnabled && platformSettings.aiReelWriterEnabled;
  const busy = Boolean(saving) || checking;

  return <form className="editor-form reel-editor" onSubmit={submit}>
    <section className="editor-card"><div className="card-head"><div><span className="eyebrow">VIDEO COMMERCE</span><h3>{locale === "ar" ? "ملف الريلز" : "Reel video"}</h3></div><span className="secure-note">{locale === "ar" ? `الحد الأقصى ${platformSettings.maxReelSizeMB}MB` : `${platformSettings.maxReelSizeMB}MB maximum`}</span></div><MediaUploader resourceType="video" folder="tijvorya/reels" value={videoUrl} onChange={setVideoUrl} maxMB={platformSettings.maxReelSizeMB} label={locale === "ar" ? "اختر الفيديو من جهازك" : "Choose video from your device"} /></section>
    <section className="editor-card">
      <div className="card-head"><div><span className="eyebrow">PRODUCT LINK</span><h3>{locale === "ar" ? "ربط الفيديو بالمنتج" : "Connect video to product"}</h3></div>{writerAvailable && <div className="reel-ai-actions"><button type="button" className="button button-ai" disabled={generating || !selectedProduct} onClick={generateCaption}>{generating ? <LoaderCircle className="spin" /> : <Sparkles />}{locale === "ar" ? "كابشن ذكي" : "AI caption"}</button><button type="button" className="button button-secondary" disabled={generating || !selectedProduct} onClick={generateStrategy}><Sparkles />{locale === "ar" ? "استراتيجية كاملة" : "Full strategy"}</button></div>}</div>
      {merchantProducts.length ? <label className="field"><span>{locale === "ar" ? "المنتج" : "Product"}</span><select name="productId" required value={productId} onChange={(event) => setProductId(event.target.value)}><option value="" disabled>{locale === "ar" ? "اختر المنتج الظاهر في الفيديو" : "Select the product featured in the video"}</option>{merchantProducts.map((product) => <option key={product.id} value={product.id}>{locale === "ar" ? product.name : product.nameEn}</option>)}</select></label> : <div className="inline-warning">{locale === "ar" ? "لا توجد منتجات نشطة. أضف منتجًا قبل رفع الريلز." : "No active products. Add a product before uploading a reel."}</div>}
      {strategy && <div className="reel-strategy-card"><div><strong>{locale === "ar" ? "أفضل وقت نشر مقترح" : "Suggested posting window"}</strong><span>{strategy.bestPostTime}</span><p>{locale === "ar" ? strategy.bestPostTimeReasonAr : strategy.bestPostTimeReasonEn}</p></div><div><strong>{locale === "ar" ? "خطة المشاهد من صور المنتج" : "Image-to-reel storyboard"}</strong><ol>{(locale === "ar" ? strategy.storyboardAr : strategy.storyboardEn).map((step) => <li key={step}>{step}</li>)}</ol></div></div>}
      {aiMode && <div className="ai-disclosure"><Sparkles /><span>{locale === "ar" ? `الكابشن مقترح بواسطة ${aiMode === "live" ? "OpenAI" : "المولد المحلي الاحتياطي"}. القرار والتحرير النهائي للتاجر.` : `Caption suggested by ${aiMode === "live" ? "OpenAI" : "the local fallback generator"}. Final editing remains with the merchant.`}</span></div>}
      <div className="form-grid two"><label className="field"><span>{locale === "ar" ? "الكابشن العربي" : "Arabic caption"}</span><textarea name="caption" rows={6} required maxLength={300} value={caption} onChange={(event) => setCaption(event.target.value)} /></label><label className="field"><span>{locale === "ar" ? "الكابشن الإنجليزي" : "English caption"}</span><textarea name="captionEn" rows={6} maxLength={300} value={captionEn} onChange={(event) => setCaptionEn(event.target.value)} /></label></div>
    </section>
    <section className="editor-card"><div className="card-head"><div><span className="eyebrow">COVER</span><h3>{locale === "ar" ? "غلاف الفيديو" : "Video cover"}</h3></div></div><MediaUploader resourceType="image" folder="tijvorya/reels" value={cover} onChange={setCover} maxMB={5} label={locale === "ar" ? "صورة غلاف اختيارية" : "Optional cover image"} /></section>
    {platformSettings.aiEnabled && platformSettings.aiModerationEnabled && <div className="approval-note ai-safety-note"><ShieldCheck /><div><strong>{locale === "ar" ? "فحص سلامة ذكي قبل الإرسال" : "AI safety check before submission"}</strong><p>{locale === "ar" ? "يُفحص الكابشن والغلاف المتاح قبل دخوله قائمة الإدارة. هذا الفحص مساعد ولا يلغي مراجعة الإدارة." : "The caption and available cover are checked before entering the admin queue. This assists, but does not replace, admin review."}</p></div></div>}
    <div className="approval-note"><FileCheck2 /><div><strong>{locale === "ar" ? "مسار المراجعة" : "Moderation workflow"}</strong><p>{locale === "ar" ? "يمكنك حفظه كمسودة، أو إرساله إلى قائمة الإدارة. لن يظهر للعامة إلا بعد الاعتماد، وسيظهر سبب الرفض للتاجر عند رفضه." : "Save as draft or submit to the admin queue. It will not be public before approval, and rejection feedback will be shown to the merchant."}</p></div></div>
    <div className="sticky-form-actions"><button type="button" className="button button-ghost" onClick={() => router.back()}>{locale === "ar" ? "إلغاء" : "Cancel"}</button><button type="submit" name="intent" value="draft" className="button button-secondary" disabled={busy || merchantProducts.length === 0}>{saving === "draft" ? <LoaderCircle className="spin" /> : <Save />}{locale === "ar" ? "حفظ كمسودة" : "Save draft"}</button><button type="submit" name="intent" value="pending" className="button button-dark" disabled={busy || merchantProducts.length === 0}>{saving === "pending" || checking ? <LoaderCircle className="spin" /> : <Send />}{checking ? (locale === "ar" ? "جارٍ فحص المحتوى" : "Checking content") : (locale === "ar" ? "إرسال للمراجعة" : "Submit for review")}</button></div>
  </form>;
}
