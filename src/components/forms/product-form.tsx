"use client";

import { LoaderCircle, Save, Sparkles } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MediaUploader } from "./media-uploader";
import { useApp } from "@/providers/app-provider";
import { safeNumber, uid } from "@/lib/utils";
import type { Product } from "@/types";
import type { AIProductCopy } from "@/types/ai";

export function ProductForm({ product }: { product?: Product }) {
  const { locale, stores, currentUser, saveProduct, toast, platformSettings } = useApp();
  const router = useRouter();
  const merchantStore = useMemo(() => stores.find((store) => store.ownerId === currentUser?.id), [stores, currentUser]);
  const [image, setImage] = useState(product?.image ?? "");
  const [name, setName] = useState(product?.name ?? "");
  const [nameEn, setNameEn] = useState(product?.nameEn ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [descriptionEn, setDescriptionEn] = useState(product?.descriptionEn ?? "");
  const [category, setCategory] = useState(product?.category ?? "");
  const [aiMode, setAiMode] = useState<"live" | "local fallback" | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  async function generateCopy() {
    if (!name.trim() || !category.trim()) {
      toast(locale === "ar" ? "أدخل اسم المنتج والتصنيف أولًا" : "Enter the product name and category first", "error");
      return;
    }
    setGenerating(true);
    try {
      const response = await fetch("/api/ai/product-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, features: description, tone: "premium" }),
      });
      const payload = await response.json() as { data?: AIProductCopy; mode?: "live" | "local fallback"; error?: string; errorEn?: string };
      if (!response.ok || !payload.data) throw new Error(locale === "ar" ? payload.error : payload.errorEn);
      setNameEn(payload.data.nameEn);
      setDescription(payload.data.descriptionAr);
      setDescriptionEn(payload.data.descriptionEn);
      setAiMode(payload.mode ?? "live");
      toast(locale === "ar" ? "تم إنشاء وصف مقترح. راجعه قبل الحفظ." : "AI copy generated. Review it before saving.");
    } catch (error) {
      toast(error instanceof Error && error.message ? error.message : (locale === "ar" ? "تعذر إنشاء الوصف" : "Unable to generate copy"), "error");
    } finally { setGenerating(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!merchantStore) { toast(locale === "ar" ? "أنشئ متجرك أولًا" : "Create your store first", "error"); return; }
    const form = new FormData(event.currentTarget);
    const price = safeNumber(form.get("price"));
    const stock = Math.max(0, Math.trunc(safeNumber(form.get("stock"))));
    const compareAtPrice = safeNumber(form.get("compareAtPrice"));
    if (price <= 0) { toast(locale === "ar" ? "أدخل سعرًا صحيحًا" : "Enter a valid price", "error"); return; }
    if (compareAtPrice > 0 && compareAtPrice <= price) { toast(locale === "ar" ? "السعر قبل الخصم يجب أن يكون أعلى من السعر الحالي." : "Compare-at price must be higher than the current price.", "error"); return; }
    if (!image) { toast(locale === "ar" ? "أضف صورة المنتج" : "Add a product image", "error"); return; }
    setSaving(true);
    try {
      const item: Product = {
        id: product?.id ?? uid("prd"), storeId: merchantStore.id,
        name: name.trim(), nameEn: nameEn.trim() || name.trim(),
        description: description.trim(), descriptionEn: descriptionEn.trim() || description.trim(),
        price, compareAtPrice: compareAtPrice || undefined, stock,
        category: category.trim(), image, images: [image],
        status: String(form.get("status") ?? "active") as Product["status"], rating: product?.rating ?? 0,
        variants: String(form.get("variants") ?? "").split(",").map((value) => value.trim()).filter(Boolean), featured: form.get("featured") === "on",
      };
      await saveProduct(item); router.push(`/${locale}/merchant/products`);
    } catch (error) { toast(error instanceof Error ? error.message : "Unable to save product", "error"); }
    finally { setSaving(false); }
  }

  const aiAvailable = platformSettings.aiEnabled && platformSettings.aiProductWriterEnabled;

  return <form className="editor-form" onSubmit={submit}>
    <section className="editor-card">
      <div className="card-head"><div><span className="eyebrow">PRODUCT IDENTITY</span><h3>{locale === "ar" ? "بيانات المنتج" : "Product information"}</h3></div>{aiAvailable && <button type="button" className="button button-ai" disabled={generating} onClick={generateCopy}>{generating ? <LoaderCircle className="spin" /> : <Sparkles />}{locale === "ar" ? "إنشاء الوصف بالذكاء الاصطناعي" : "Generate with AI"}</button>}</div>
      {aiMode && <div className="ai-disclosure"><Sparkles /><span>{locale === "ar" ? `محتوى مقترح بواسطة ${aiMode === "live" ? "OpenAI" : "المولد المحلي الاحتياطي"}. يجب مراجعته قبل النشر.` : `Suggested by ${aiMode === "live" ? "OpenAI" : "the local fallback generator"}. Review before publishing.`}</span></div>}
      <div className="form-grid two"><label className="field"><span>{locale === "ar" ? "اسم المنتج بالعربية" : "Arabic product name"}</span><input name="name" required value={name} onChange={(event) => setName(event.target.value)} /></label><label className="field"><span>{locale === "ar" ? "اسم المنتج بالإنجليزية" : "English product name"}</span><input name="nameEn" value={nameEn} onChange={(event) => setNameEn(event.target.value)} /></label></div>
      <label className="field"><span>{locale === "ar" ? "التصنيف" : "Category"}</span><input name="category" required value={category} onChange={(event) => setCategory(event.target.value)} placeholder={locale === "ar" ? "مثال: عطور، أزياء، تقنية" : "Example: Fragrance, Fashion, Technology"} /></label>
      <div className="form-grid two"><label className="field"><span>{locale === "ar" ? "الوصف العربي" : "Arabic description"}</span><textarea name="description" rows={6} required value={description} onChange={(event) => setDescription(event.target.value)} /></label><label className="field"><span>{locale === "ar" ? "الوصف الإنجليزي" : "English description"}</span><textarea name="descriptionEn" rows={6} value={descriptionEn} onChange={(event) => setDescriptionEn(event.target.value)} /></label></div>
    </section>
    <section className="editor-card"><div className="card-head"><div><span className="eyebrow">MEDIA</span><h3>{locale === "ar" ? "صورة المنتج" : "Product media"}</h3></div></div><MediaUploader resourceType="image" folder="tijvorya/products" value={image} onChange={setImage} maxMB={8} label={locale === "ar" ? "الصورة الرئيسية" : "Main image"} /></section>
    <section className="editor-card"><div className="card-head"><div><span className="eyebrow">COMMERCE</span><h3>{locale === "ar" ? "السعر والمخزون" : "Price and inventory"}</h3></div></div><div className="form-grid four"><label className="field"><span>{locale === "ar" ? "السعر" : "Price"}</span><input name="price" type="number" min="1" step="0.01" required defaultValue={product?.price} /></label><label className="field"><span>{locale === "ar" ? "السعر قبل الخصم" : "Compare at price"}</span><input name="compareAtPrice" type="number" min="0" step="0.01" defaultValue={product?.compareAtPrice} /></label><label className="field"><span>{locale === "ar" ? "المخزون" : "Stock"}</span><input name="stock" type="number" min="0" required defaultValue={product?.stock ?? 1} /></label><label className="field"><span>{locale === "ar" ? "المتغيرات — افصل بفاصلة" : "Variants — comma separated"}</span><input name="variants" defaultValue={product?.variants?.join(", ")} placeholder={locale === "ar" ? "S, M, L أو أسود, ذهبي" : "S, M, L or Black, Gold"} /></label></div><div className="form-grid two"><label className="field"><span>{locale === "ar" ? "حالة المنتج" : "Product status"}</span><select name="status" defaultValue={product?.status ?? "active"}><option value="active">{locale === "ar" ? "نشط" : "Active"}</option><option value="draft">{locale === "ar" ? "مسودة" : "Draft"}</option><option value="archived">{locale === "ar" ? "مؤرشف" : "Archived"}</option></select></label><label className="check-card"><input type="checkbox" name="featured" defaultChecked={product?.featured} /><span><strong>{locale === "ar" ? "منتج مميز" : "Featured product"}</strong><small>{locale === "ar" ? "إظهاره في مناطق مختارة من المتجر" : "Show in curated store sections"}</small></span></label></div></section>
    <div className="sticky-form-actions"><button type="button" className="button button-ghost" onClick={() => router.back()}>{locale === "ar" ? "إلغاء" : "Cancel"}</button><button className="button button-dark" disabled={saving}>{saving ? <LoaderCircle className="spin" /> : <Save />}{locale === "ar" ? "حفظ المنتج" : "Save product"}</button></div>
  </form>;
}
