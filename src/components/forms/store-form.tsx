"use client";

import { Eye, LoaderCircle, Save, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { MediaUploader } from "./media-uploader";
import { StoreThemeEditor } from "./store-theme-editor";
import { normalizeStoreTheme } from "@/lib/store-theme";
import { businessCategoryOptions, isReservedStoreSlug, merchantDomain, merchantStoreHref, normalizeStoreWebsiteProfile } from "@/lib/store-website";
import { useApp } from "@/providers/app-provider";
import { safeNumber, slugify, uid } from "@/lib/utils";
import type { Store } from "@/types";

export function StoreForm() {
  const { locale, stores, currentUser, updateStore, toast } = useApp();
  const current = useMemo(() => stores.find((store) => store.ownerId === currentUser?.id), [stores, currentUser?.id]);
  const website = useMemo(() => normalizeStoreWebsiteProfile(current?.website), [current?.website]);
  const [logo, setLogo] = useState(current?.logo ?? "/assets/logo.svg");
  const [cover, setCover] = useState(current?.cover ?? "/assets/cover-urban.svg");
  const [theme, setTheme] = useState(() => normalizeStoreTheme(current?.theme, current?.themeColor));
  const [saving, setSaving] = useState(false);
  const [savedSlug, setSavedSlug] = useState(current?.slug ?? "");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentUser) return;
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const requestedSlug = String(form.get("slug") ?? "").trim();
    const slug = slugify(requestedSlug || name);
    if (isReservedStoreSlug(slug)) {
      toast(locale === "ar" ? "هذا الدومين محجوز للمنصة. اختر اسمًا آخر." : "This subdomain is reserved by the platform. Choose another name.", "error");
      return;
    }
    const duplicate = stores.some((item) => item.id !== current?.id && item.slug.toLocaleLowerCase() === slug.toLocaleLowerCase());
    if (duplicate) {
      toast(locale === "ar" ? "رابط المتجر مستخدم. اختر رابطًا مختلفًا." : "This store URL is already used. Choose another one.", "error");
      return;
    }

    setSaving(true);
    try {
      const store: Store = {
        id: current?.id ?? uid("store"),
        ownerId: currentUser.id,
        slug,
        name,
        nameEn: String(form.get("nameEn") ?? "").trim() || name,
        description: String(form.get("description") ?? "").trim(),
        descriptionEn: String(form.get("descriptionEn") ?? "").trim() || String(form.get("description") ?? "").trim(),
        logo,
        cover,
        rating: current?.rating ?? 0,
        verified: current?.verified ?? false,
        city: String(form.get("city") ?? "").trim(),
        completion: 100,
        status: current?.status ?? "active",
        phone: String(form.get("phone") ?? "").trim(),
        whatsapp: String(form.get("whatsapp") ?? "").trim(),
        deliveryFee: Math.max(0, safeNumber(form.get("deliveryFee"))),
        themeColor: theme.accentColor,
        theme,
        website: {
          onboardingCompleted: website.onboardingCompleted,
          legalName: String(form.get("legalName") ?? website.legalName ?? "").trim(),
          registrationNumber: String(form.get("registrationNumber") ?? website.registrationNumber ?? "").trim(),
          domain: merchantDomain(slug),
          businessCategory: String(form.get("businessCategory") ?? website.businessCategory),
          tagline: String(form.get("tagline") ?? "").trim(),
          taglineEn: String(form.get("taglineEn") ?? "").trim() || String(form.get("tagline") ?? "").trim(),
          about: String(form.get("about") ?? "").trim(),
          aboutEn: String(form.get("aboutEn") ?? "").trim() || String(form.get("about") ?? "").trim(),
          businessEmail: String(form.get("businessEmail") ?? "").trim(),
          country: String(form.get("country") ?? "").trim(),
          address: String(form.get("address") ?? "").trim(),
          openingHours: String(form.get("openingHours") ?? "").trim(),
          shippingAreas: String(form.get("shippingAreas") ?? "").trim(),
          returnPolicy: String(form.get("returnPolicy") ?? "").trim(),
          instagram: String(form.get("instagram") ?? "").trim(),
          facebook: String(form.get("facebook") ?? "").trim(),
          tiktok: String(form.get("tiktok") ?? "").trim(),
        },
      };
      await updateStore(store);
      setSavedSlug(slug);
      toast(locale === "ar" ? "تم حفظ المتجر والثيم. أصبحت المعاينة جاهزة." : "Store and theme saved. Preview is ready.");
    } catch (error) {
      const message = error instanceof Error && error.message === "STORE_SLUG_TAKEN"
        ? (locale === "ar" ? "رابط المتجر مستخدم من متجر آخر. اختر رابطًا مختلفًا." : "This store URL is already used by another store. Choose a different one.")
        : error instanceof Error ? error.message : "Unable to save store";
      toast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  const previewHref = savedSlug ? merchantStoreHref(savedSlug, locale) : "";

  return <form className="editor-form" onSubmit={submit}>
    <section className="editor-card">
      <div className="card-head"><div><span className="eyebrow">STORE IDENTITY</span><h3>{locale === "ar" ? "هوية المتجر" : "Store identity"}</h3></div></div>
      <div className="form-grid two">
        <label className="field"><span>{locale === "ar" ? "اسم المتجر بالعربية" : "Arabic store name"}</span><input name="name" required defaultValue={current?.name} /></label>
        <label className="field"><span>{locale === "ar" ? "اسم المتجر بالإنجليزية" : "English store name"}</span><input name="nameEn" defaultValue={current?.nameEn} /></label>
      </div>
      <label className="field"><span>{locale === "ar" ? "دومين المتجر" : "Store domain"}</span><div className="slug-input domain-slug-input"><input name="slug" dir="ltr" defaultValue={current?.slug} placeholder="my-store" autoCapitalize="none" spellCheck={false} /><span>.tijvorya.com</span></div><small className="field-help">{locale === "ar" ? "اختر اسمًا قصيرًا ورسميًا. سيصبح موقعك مثل: my-store.tijvorya.com" : "Choose a short professional name. Your site will be available at my-store.tijvorya.com."}</small></label>
      <div className="form-grid two">
        <label className="field"><span>{locale === "ar" ? "وصف المتجر" : "Arabic description"}</span><textarea name="description" rows={5} required defaultValue={current?.description} /></label>
        <label className="field"><span>{locale === "ar" ? "الوصف الإنجليزي" : "English description"}</span><textarea name="descriptionEn" rows={5} defaultValue={current?.descriptionEn} /></label>
      </div>
    </section>

    <section className="editor-card">
      <div className="card-head"><div><span className="eyebrow">WEBSITE CONTENT</span><h3>{locale === "ar" ? "محتوى موقع المتجر" : "Store website content"}</h3><p>{locale === "ar" ? "هذه البيانات تظهر تلقائيًا في صفحات الرئيسية والمنتجات وعن المتجر." : "These details automatically power your Home, Products and About pages."}</p></div></div>
      <div className="form-grid three">
        <label className="field"><span>{locale === "ar" ? "مجال النشاط" : "Business category"}</span><select name="businessCategory" defaultValue={website.businessCategory}>{businessCategoryOptions.map((item) => <option key={item.value} value={item.value}>{locale === "ar" ? item.ar : item.en}</option>)}</select></label>
        <label className="field"><span>{locale === "ar" ? "البريد التجاري" : "Business email"}</span><input name="businessEmail" type="email" dir="ltr" defaultValue={website.businessEmail || currentUser?.email} /></label>
        <label className="field"><span>{locale === "ar" ? "الدولة" : "Country"}</span><input name="country" defaultValue={website.country} /></label>
      </div>
      <div className="form-grid two">
        <label className="field"><span>{locale === "ar" ? "الاسم القانوني للنشاط" : "Legal business name"}</span><input name="legalName" defaultValue={website.legalName} /></label>
        <label className="field"><span>{locale === "ar" ? "رقم التسجيل / الترخيص" : "Registration / license number"}</span><input name="registrationNumber" dir="ltr" defaultValue={website.registrationNumber} /></label>
      </div>
      <div className="form-grid two">
        <label className="field"><span>{locale === "ar" ? "العنوان التسويقي" : "Marketing headline"}</span><input name="tagline" maxLength={90} defaultValue={website.tagline} /></label>
        <label className="field"><span>{locale === "ar" ? "العنوان بالإنجليزية" : "English headline"}</span><input name="taglineEn" dir="ltr" maxLength={90} defaultValue={website.taglineEn} /></label>
      </div>
      <div className="form-grid two">
        <label className="field"><span>{locale === "ar" ? "قصة المتجر" : "Brand story"}</span><textarea name="about" rows={6} defaultValue={website.about} /></label>
        <label className="field"><span>{locale === "ar" ? "القصة بالإنجليزية" : "English brand story"}</span><textarea name="aboutEn" dir="ltr" rows={6} defaultValue={website.aboutEn} /></label>
      </div>
      <div className="form-grid two">
        <label className="field"><span>{locale === "ar" ? "العنوان التفصيلي" : "Business address"}</span><input name="address" defaultValue={website.address} /></label>
        <label className="field"><span>{locale === "ar" ? "ساعات العمل" : "Business hours"}</span><input name="openingHours" defaultValue={website.openingHours} /></label>
        <label className="field"><span>{locale === "ar" ? "مناطق التوصيل" : "Delivery areas"}</span><input name="shippingAreas" defaultValue={website.shippingAreas} /></label>
        <label className="field"><span>{locale === "ar" ? "سياسة الاستبدال والإرجاع" : "Returns policy"}</span><textarea name="returnPolicy" rows={3} defaultValue={website.returnPolicy} /></label>
      </div>
      <div className="form-grid three">
        <label className="field"><span>Instagram</span><input name="instagram" dir="ltr" defaultValue={website.instagram} placeholder="instagram.com/brand" /></label>
        <label className="field"><span>Facebook</span><input name="facebook" dir="ltr" defaultValue={website.facebook} placeholder="facebook.com/brand" /></label>
        <label className="field"><span>TikTok</span><input name="tiktok" dir="ltr" defaultValue={website.tiktok} placeholder="tiktok.com/@brand" /></label>
      </div>
    </section>

    <section className="editor-card">
      <div className="card-head"><div><span className="eyebrow">VISUAL ASSETS</span><h3>{locale === "ar" ? "الشعار والغلاف" : "Logo and cover"}</h3></div></div>
      <div className="form-grid two">
        <MediaUploader resourceType="image" folder="tijvorya/stores" value={logo} onChange={setLogo} maxMB={5} label={locale === "ar" ? "شعار المتجر" : "Store logo"} />
        <MediaUploader resourceType="image" folder="tijvorya/stores" value={cover} onChange={setCover} maxMB={8} label={locale === "ar" ? "خلفية البروفايل" : "Profile cover"} />
      </div>
    </section>

    <StoreThemeEditor locale={locale} store={current ? { ...current, logo, cover } : undefined} value={theme} onChange={setTheme} />

    <section className="editor-card">
      <div className="card-head"><div><span className="eyebrow">OPERATIONS</span><h3>{locale === "ar" ? "التواصل والتوصيل" : "Contact and delivery"}</h3></div></div>
      <div className="form-grid four">
        <label className="field"><span>{locale === "ar" ? "المدينة" : "City"}</span><input name="city" required defaultValue={current?.city} /></label>
        <label className="field"><span>{locale === "ar" ? "الهاتف" : "Phone"}</span><input name="phone" type="tel" defaultValue={current?.phone} /></label>
        <label className="field"><span>WhatsApp</span><input name="whatsapp" type="tel" defaultValue={current?.whatsapp} /></label>
        <label className="field"><span>{locale === "ar" ? "رسوم التوصيل" : "Delivery fee"}</span><input name="deliveryFee" type="number" min="0" defaultValue={current?.deliveryFee ?? 0} /></label>
      </div>
    </section>

    <div className="sticky-form-actions">
      <span className="muted secure-save-copy"><ShieldCheck />{locale === "ar" ? "الحفظ يحدّث الثيم ثم يفتح رابط متجر عام صالح وآمن." : "Saving updates the theme and creates a valid secure public store URL."}</span>
      <div className="form-action-group">
        {previewHref && <Link className="button button-ghost" target="_blank" rel="noopener noreferrer" href={previewHref}><Eye />{locale === "ar" ? "معاينة المتجر" : "Preview store"}</Link>}
        <button className="button button-dark" disabled={saving}>{saving ? <LoaderCircle className="spin" /> : <Save />}{locale === "ar" ? "حفظ المتجر والثيم" : "Save store and theme"}</button>
      </div>
    </div>
  </form>;
}
