"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, BadgeCheck, Building2, Check, Eye, Globe2, LoaderCircle, Palette, Rocket, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { MediaUploader } from "./media-uploader";
import { StoreThemeEditor } from "./store-theme-editor";
import { normalizeStoreTheme } from "@/lib/store-theme";
import { businessCategoryOptions, isReservedStoreSlug, merchantDomain, merchantStoreHref, normalizeStoreWebsiteProfile } from "@/lib/store-website";
import { useApp } from "@/providers/app-provider";
import { safeNumber, slugify, uid } from "@/lib/utils";
import type { Store, StoreTheme, StoreWebsiteProfile } from "@/types";

type Draft = {
  name: string;
  nameEn: string;
  slug: string;
  description: string;
  descriptionEn: string;
  businessCategory: string;
  tagline: string;
  taglineEn: string;
  businessEmail: string;
  country: string;
  city: string;
  address: string;
  phone: string;
  whatsapp: string;
  openingHours: string;
  shippingAreas: string;
  returnPolicy: string;
  deliveryFee: string;
  about: string;
  aboutEn: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  legalName: string;
  registrationNumber: string;
};

const stepIcons = [Building2, Truck, Globe2, Palette];

function valueOr(value: string | undefined, fallback = "") { return value?.trim() ? value : fallback; }

export function StoreOnboardingWizard() {
  const { locale, stores, currentUser, updateStore, toast } = useApp();
  const router = useRouter();
  const current = useMemo(() => stores.find((store) => store.ownerId === currentUser?.id), [stores, currentUser?.id]);
  const website = normalizeStoreWebsiteProfile(current?.website);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [logo, setLogo] = useState(current?.logo ?? "");
  const [cover, setCover] = useState(current?.cover ?? "");
  const [theme, setTheme] = useState<StoreTheme>(() => normalizeStoreTheme(current?.theme, current?.themeColor));
  const [draft, setDraft] = useState<Draft>(() => ({
    name: current?.name ?? "",
    nameEn: current?.nameEn ?? "",
    slug: current?.slug ?? "",
    description: current?.description ?? "",
    descriptionEn: current?.descriptionEn ?? "",
    businessCategory: website.businessCategory,
    tagline: website.tagline,
    taglineEn: website.taglineEn,
    businessEmail: website.businessEmail || currentUser?.email || "",
    country: website.country,
    city: current?.city ?? "",
    address: website.address,
    phone: current?.phone || currentUser?.phone || "",
    whatsapp: current?.whatsapp ?? "",
    openingHours: website.openingHours,
    shippingAreas: website.shippingAreas,
    returnPolicy: website.returnPolicy,
    deliveryFee: String(current?.deliveryFee ?? 0),
    about: website.about,
    aboutEn: website.aboutEn,
    instagram: website.instagram ?? "",
    facebook: website.facebook ?? "",
    tiktok: website.tiktok ?? "",
    legalName: website.legalName ?? "",
    registrationNumber: website.registrationNumber ?? "",
  }));

  function patch<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }

  const steps = locale === "ar"
    ? [
      { title: "هوية النشاط", text: "الاسم، المجال والرسالة الأساسية" },
      { title: "التواصل والتوصيل", text: "الموقع، ساعات العمل وخدمة الطلبات" },
      { title: "قصة العلامة", text: "المحتوى الذي سيظهر في صفحة عن المتجر" },
      { title: "التصميم والإطلاق", text: "الشعار، الغلاف والثيم النهائي" },
    ]
    : [
      { title: "Business identity", text: "Name, category and core message" },
      { title: "Contact & delivery", text: "Location, hours and order service" },
      { title: "Brand story", text: "Content for the About page" },
      { title: "Design & launch", text: "Logo, cover and final theme" },
    ];

  function validateCurrentStep() {
    if (step === 0) {
      if (!draft.name.trim() || !draft.description.trim() || !draft.tagline.trim() || !draft.businessCategory) {
        toast(locale === "ar" ? "أكمل اسم المتجر، المجال، العبارة الرئيسية والوصف قبل المتابعة." : "Complete the store name, category, headline and description before continuing.", "error");
        return false;
      }
      const finalSlug = slugify(draft.slug.trim() || draft.name);
      if (!finalSlug) {
        toast(locale === "ar" ? "اكتب اسم متجر صالح لإنشاء نطاق الموقع." : "Enter a valid store name to create the website domain.", "error");
        return false;
      }
      if (isReservedStoreSlug(finalSlug)) {
        toast(locale === "ar" ? "هذا النطاق محجوز لخدمات Tijvorya. اختر اسمًا مختلفًا." : "This subdomain is reserved for Tijvorya services. Choose another name.", "error");
        return false;
      }
      const duplicate = stores.some((item) => item.id !== current?.id && item.slug.toLocaleLowerCase() === finalSlug.toLocaleLowerCase());
      if (duplicate) {
        toast(locale === "ar" ? "رابط الموقع مستخدم. اختر رابطًا مختلفًا." : "This website URL is already in use. Choose another one.", "error");
        return false;
      }
      if (draft.slug !== finalSlug) patch("slug", finalSlug);
    }
    if (step === 1) {
      const required = [draft.businessEmail, draft.phone, draft.country, draft.city, draft.address, draft.openingHours, draft.shippingAreas, draft.returnPolicy];
      if (required.some((item) => !item.trim())) {
        toast(locale === "ar" ? "أكمل بيانات التواصل والعنوان والتوصيل وسياسة الاستبدال." : "Complete contact, location, delivery and return-policy information.", "error");
        return false;
      }
      if (!/^\S+@\S+\.\S+$/.test(draft.businessEmail.trim())) {
        toast(locale === "ar" ? "اكتب بريدًا تجاريًا صالحًا." : "Enter a valid business email.", "error");
        return false;
      }
    }
    if (step === 2 && !draft.about.trim()) {
      toast(locale === "ar" ? "اكتب قصة مختصرة عن النشاط التجاري." : "Add a short story about the business.", "error");
      return false;
    }
    if (step === 3 && (!logo.trim() || !cover.trim())) {
      toast(locale === "ar" ? "ارفع شعار المتجر وصورة غلاف أصلية قبل إطلاق الموقع." : "Upload both a store logo and an original cover image before launching the website.", "error");
      return false;
    }
    return true;
  }

  function next() {
    if (!validateCurrentStep()) return;
    setStep((value) => Math.min(3, value + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function previous() {
    setStep((value) => Math.max(0, value - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function launch() {
    if (!currentUser || !validateCurrentStep()) return;
    const slug = slugify(draft.slug.trim() || draft.name);
    const duplicate = stores.some((item) => item.id !== current?.id && item.slug.toLocaleLowerCase() === slug.toLocaleLowerCase());
    if (duplicate) {
      toast(locale === "ar" ? "رابط الموقع مستخدم. اختر رابطًا مختلفًا." : "This website URL is already in use.", "error");
      setStep(0);
      return;
    }
    setSaving(true);
    try {
      const profile: StoreWebsiteProfile = {
        onboardingCompleted: true,
        businessCategory: draft.businessCategory,
        tagline: draft.tagline.trim(),
        taglineEn: valueOr(draft.taglineEn, draft.tagline.trim()),
        about: draft.about.trim(),
        aboutEn: valueOr(draft.aboutEn, draft.about.trim()),
        businessEmail: draft.businessEmail.trim(),
        country: draft.country.trim(),
        address: draft.address.trim(),
        openingHours: draft.openingHours.trim(),
        shippingAreas: draft.shippingAreas.trim(),
        returnPolicy: draft.returnPolicy.trim(),
        instagram: draft.instagram.trim(),
        facebook: draft.facebook.trim(),
        tiktok: draft.tiktok.trim(),
        legalName: draft.legalName.trim(),
        registrationNumber: draft.registrationNumber.trim(),
        domain: merchantDomain(slug),
      };
      const store: Store = {
        id: current?.id ?? uid("store"),
        ownerId: currentUser.id,
        slug,
        name: draft.name.trim(),
        nameEn: valueOr(draft.nameEn, draft.name.trim()),
        description: draft.description.trim(),
        descriptionEn: valueOr(draft.descriptionEn, draft.description.trim()),
        logo,
        cover,
        rating: current?.rating ?? 0,
        verified: current?.verified ?? false,
        city: draft.city.trim(),
        completion: 100,
        status: current?.status === "suspended" ? "suspended" : "active",
        phone: draft.phone.trim(),
        whatsapp: draft.whatsapp.trim(),
        deliveryFee: Math.max(0, safeNumber(draft.deliveryFee)),
        themeColor: theme.accentColor,
        theme,
        website: profile,
      };
      await updateStore(store);
      toast(locale === "ar" ? "تم إنشاء موقع متجرك بثلاث صفحات وهو جاهز للنشر." : "Your three-page merchant website is ready to publish.");
      router.replace(`/${locale}/merchant`);
    } catch (error) {
      // Supabase/PostgREST throws the raw error object from the query
      // (message/details/hint/code), not a real Error instance - an
      // `error instanceof Error` check here always misses it and fell
      // through to the generic fallback, hiding the actual database error
      // (this masked the real "Only an administrator can verify a store"
      // trigger message behind a useless generic one).
      const rawMessage = error instanceof Error ? error.message
        : error && typeof error === "object" && "message" in error && typeof error.message === "string" ? error.message
          : undefined;
      const message = rawMessage === "STORE_SLUG_TAKEN"
        ? (locale === "ar" ? "رابط الموقع مستخدم من متجر آخر. اختر رابطًا مختلفًا." : "This website URL is already used by another store. Choose a different one.")
        : rawMessage ?? (locale === "ar" ? "تعذر إنشاء موقع المتجر." : "Unable to create the store website.");
      if (rawMessage === "STORE_SLUG_TAKEN") setStep(0);
      toast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  const previewStore: Store = {
    id: current?.id ?? "preview-store",
    ownerId: currentUser?.id ?? "preview-owner",
    slug: draft.slug || "my-store",
    name: draft.name || (locale === "ar" ? "اسم متجرك" : "Your store"),
    nameEn: draft.nameEn || draft.name || "Your store",
    description: draft.description,
    descriptionEn: draft.descriptionEn || draft.description,
    logo: logo || "/assets/logo.svg",
    cover: cover || "/assets/cover-urban.svg",
    rating: current?.rating ?? 0,
    verified: current?.verified ?? false,
    city: draft.city,
    completion: 100,
    status: "active",
    phone: draft.phone,
    whatsapp: draft.whatsapp,
    deliveryFee: safeNumber(draft.deliveryFee),
    theme,
  };
  const generatedSlug = slugify(draft.slug || draft.name || "my-store");
  const siteHref = current?.website?.onboardingCompleted ? merchantStoreHref(current.slug, locale) : "";

  return <div className="merchant-onboarding">
    <div className="onboarding-progress-card">
      <div className="onboarding-progress-head"><div><span className="eyebrow">TIJVORYA WEBSITE BUILDER</span><h2>{locale === "ar" ? "ابنِ موقع متجرك في دقائق" : "Build your merchant website in minutes"}</h2><p>{locale === "ar" ? "نجمع المعلومات مرة واحدة ثم نبني لك تلقائيًا موقعًا احترافيًا من 3 صفحات: الرئيسية، المنتجات، وعن المتجر." : "Provide your business information once and Tijvorya automatically builds a professional 3-page website: Home, Products and About."}</p></div>{siteHref && <Link className="button button-ghost" href={siteHref} target="_blank" rel="noopener noreferrer"><Eye />{locale === "ar" ? "فتح الموقع الحالي" : "Open current site"}</Link>}</div>
      <div className="onboarding-stepper">{steps.map((item, index) => { const Icon = stepIcons[index]; return <button type="button" key={item.title} className={`${index === step ? "is-active" : ""} ${index < step ? "is-complete" : ""}`} onClick={() => index < step && setStep(index)}><span>{index < step ? <Check /> : <Icon />}</span><div><strong>{item.title}</strong><small>{item.text}</small></div></button>; })}</div>
    </div>

    <div className="onboarding-workspace">
      {step === 0 && <section className="editor-card onboarding-panel">
        <div className="card-head"><div><span className="eyebrow">STEP 1 / 4</span><h3>{locale === "ar" ? "هوية النشاط التجاري" : "Business identity"}</h3><p>{locale === "ar" ? "هذه المعلومات تصنع العنوان الرئيسي والهوية الأساسية للموقع." : "These details shape the website headline and core identity."}</p></div><Building2 /></div>
        <div className="form-grid two">
          <label className="field"><span>{locale === "ar" ? "اسم المتجر بالعربية" : "Store name"} *</span><input value={draft.name} onChange={(event) => patch("name", event.target.value)} /></label>
          <label className="field"><span>{locale === "ar" ? "اسم المتجر بالإنجليزية" : "English store name"}</span><input dir="ltr" value={draft.nameEn} onChange={(event) => patch("nameEn", event.target.value)} /></label>
        </div>
        <div className="form-grid two">
          <label className="field"><span>{locale === "ar" ? "مجال النشاط" : "Business category"} *</span><select value={draft.businessCategory} onChange={(event) => patch("businessCategory", event.target.value)}>{businessCategoryOptions.map((item) => <option key={item.value} value={item.value}>{locale === "ar" ? item.ar : item.en}</option>)}</select></label>
          <label className="field"><span>{locale === "ar" ? "دومين المتجر" : "Store domain"}</span><div className="slug-input domain-slug-input"><input dir="ltr" value={draft.slug} onChange={(event) => patch("slug", event.target.value)} placeholder={generatedSlug} /><span>.{merchantDomain("store").split(".").slice(1).join(".")}</span></div><small className="domain-help">{locale === "ar" ? `سيصبح موقعك: ${merchantDomain(generatedSlug || "your-store")}` : `Your website: ${merchantDomain(generatedSlug || "your-store")}`}</small></label>
        </div>
        <div className="form-grid two">
          <label className="field"><span>{locale === "ar" ? "العنوان التسويقي الرئيسي" : "Main marketing headline"} *</span><input value={draft.tagline} maxLength={90} onChange={(event) => patch("tagline", event.target.value)} placeholder={locale === "ar" ? "مثال: أناقة يومية بتفاصيل تصنع الفرق" : "Example: Everyday style, thoughtfully selected"} /></label>
          <label className="field"><span>{locale === "ar" ? "العنوان بالإنجليزية" : "English headline"}</span><input dir="ltr" value={draft.taglineEn} maxLength={90} onChange={(event) => patch("taglineEn", event.target.value)} /></label>
        </div>
        <div className="form-grid two">
          <label className="field"><span>{locale === "ar" ? "الاسم القانوني للنشاط" : "Legal business name"}</span><input value={draft.legalName} onChange={(event) => patch("legalName", event.target.value)} placeholder={locale === "ar" ? "اختياري — كما يظهر في المستندات الرسمية" : "Optional — as shown on official documents"} /></label>
          <label className="field"><span>{locale === "ar" ? "رقم التسجيل / السجل التجاري" : "Registration / business number"}</span><input dir="ltr" value={draft.registrationNumber} onChange={(event) => patch("registrationNumber", event.target.value)} placeholder={locale === "ar" ? "اختياري" : "Optional"} /></label>
        </div>
        <div className="form-grid two">
          <label className="field"><span>{locale === "ar" ? "وصف مختصر للمتجر" : "Short store description"} *</span><textarea rows={4} value={draft.description} onChange={(event) => patch("description", event.target.value)} placeholder={locale === "ar" ? "ماذا تبيع؟ وما الذي يميز متجرك؟" : "What do you sell and what makes your store different?"} /></label>
          <label className="field"><span>{locale === "ar" ? "الوصف بالإنجليزية" : "English description"}</span><textarea dir="ltr" rows={4} value={draft.descriptionEn} onChange={(event) => patch("descriptionEn", event.target.value)} /></label>
        </div>
      </section>}

      {step === 1 && <section className="editor-card onboarding-panel">
        <div className="card-head"><div><span className="eyebrow">STEP 2 / 4</span><h3>{locale === "ar" ? "التواصل، الموقع والتوصيل" : "Contact, location & delivery"}</h3><p>{locale === "ar" ? "سنستخدمها في صفحة عن المتجر وفي أقسام الثقة والتواصل." : "These details power the About page, trust sections and contact actions."}</p></div><Truck /></div>
        <div className="form-grid three">
          <label className="field"><span>{locale === "ar" ? "البريد التجاري" : "Business email"} *</span><input type="email" dir="ltr" value={draft.businessEmail} onChange={(event) => patch("businessEmail", event.target.value)} /></label>
          <label className="field"><span>{locale === "ar" ? "رقم الهاتف" : "Phone"} *</span><input type="tel" dir="ltr" value={draft.phone} onChange={(event) => patch("phone", event.target.value)} /></label>
          <label className="field"><span>WhatsApp</span><input type="tel" dir="ltr" value={draft.whatsapp} onChange={(event) => patch("whatsapp", event.target.value)} /></label>
        </div>
        <div className="form-grid three">
          <label className="field"><span>{locale === "ar" ? "الدولة" : "Country"} *</span><input value={draft.country} onChange={(event) => patch("country", event.target.value)} /></label>
          <label className="field"><span>{locale === "ar" ? "المدينة" : "City"} *</span><input value={draft.city} onChange={(event) => patch("city", event.target.value)} /></label>
          <label className="field"><span>{locale === "ar" ? "العنوان" : "Business address"} *</span><input value={draft.address} onChange={(event) => patch("address", event.target.value)} /></label>
        </div>
        <div className="form-grid two">
          <label className="field"><span>{locale === "ar" ? "ساعات العمل" : "Business hours"} *</span><input value={draft.openingHours} onChange={(event) => patch("openingHours", event.target.value)} placeholder={locale === "ar" ? "السبت - الخميس: 10:00 ص - 8:00 م" : "Mon - Sat: 10:00 AM - 8:00 PM"} /></label>
          <label className="field"><span>{locale === "ar" ? "مناطق التوصيل" : "Delivery areas"} *</span><input value={draft.shippingAreas} onChange={(event) => patch("shippingAreas", event.target.value)} placeholder={locale === "ar" ? "غزة، الوسطى، خانيونس" : "City center, North district, ..."} /></label>
        </div>
        <div className="form-grid two">
          <label className="field"><span>{locale === "ar" ? "رسوم التوصيل الافتراضية" : "Default delivery fee"}</span><input type="number" min="0" value={draft.deliveryFee} onChange={(event) => patch("deliveryFee", event.target.value)} /></label>
          <label className="field"><span>{locale === "ar" ? "سياسة الاستبدال والإرجاع" : "Returns & exchanges policy"} *</span><textarea rows={4} value={draft.returnPolicy} onChange={(event) => patch("returnPolicy", event.target.value)} placeholder={locale === "ar" ? "مثال: الاستبدال خلال 7 أيام للمنتج غير المستخدم..." : "Example: Exchanges within 7 days for unused products..."} /></label>
        </div>
      </section>}

      {step === 2 && <section className="editor-card onboarding-panel">
        <div className="card-head"><div><span className="eyebrow">STEP 3 / 4</span><h3>{locale === "ar" ? "قصة العلامة التجارية" : "Brand story"}</h3><p>{locale === "ar" ? "محتوى صفحة «عن المتجر» يجب أن يبني الثقة ويشرح لماذا يختارك العميل." : "Your About page should build trust and explain why customers should choose you."}</p></div><Globe2 /></div>
        <div className="form-grid two">
          <label className="field"><span>{locale === "ar" ? "قصتنا / من نحن" : "Our story / About us"} *</span><textarea rows={8} value={draft.about} onChange={(event) => patch("about", event.target.value)} placeholder={locale === "ar" ? "اكتب نبذة عن بداية المتجر، ما الذي تقدمه، وما الذي تهتم به في خدمة العميل..." : "Tell customers how the store started, what it offers and what you care about..."} /></label>
          <label className="field"><span>{locale === "ar" ? "القصة بالإنجليزية" : "English brand story"}</span><textarea dir="ltr" rows={8} value={draft.aboutEn} onChange={(event) => patch("aboutEn", event.target.value)} /></label>
        </div>
        <div className="onboarding-social-block"><div><strong>{locale === "ar" ? "حسابات التواصل الاجتماعي" : "Social profiles"}</strong><small>{locale === "ar" ? "اختياري — أضف رابط الحساب الكامل أو اسم النطاق." : "Optional — add the full profile URL or domain."}</small></div><div className="form-grid three"><label className="field"><span>Instagram</span><input dir="ltr" value={draft.instagram} onChange={(event) => patch("instagram", event.target.value)} placeholder="instagram.com/brand" /></label><label className="field"><span>Facebook</span><input dir="ltr" value={draft.facebook} onChange={(event) => patch("facebook", event.target.value)} placeholder="facebook.com/brand" /></label><label className="field"><span>TikTok</span><input dir="ltr" value={draft.tiktok} onChange={(event) => patch("tiktok", event.target.value)} placeholder="tiktok.com/@brand" /></label></div></div>
        <div className="onboarding-page-map"><article><span>01</span><div><strong>{locale === "ar" ? "الرئيسية" : "Home"}</strong><small>{locale === "ar" ? "غلاف، هوية، منتجات مميزة، أقسام، ريلز وقصة مختصرة." : "Hero, brand identity, featured products, categories, reels and story."}</small></div></article><article><span>02</span><div><strong>{locale === "ar" ? "المنتجات" : "Products"}</strong><small>{locale === "ar" ? "كتالوج كامل مع البحث والفلاتر والترتيب." : "Full catalog with search, filters and sorting."}</small></div></article><article><span>03</span><div><strong>{locale === "ar" ? "عن المتجر" : "About"}</strong><small>{locale === "ar" ? "قصة المتجر، العنوان، الساعات، التوصيل والتواصل." : "Story, address, hours, delivery and contact information."}</small></div></article></div>
      </section>}

      {step === 3 && <>
        <section className="editor-card onboarding-panel">
          <div className="card-head"><div><span className="eyebrow">STEP 4 / 4</span><h3>{locale === "ar" ? "الشعار والغلاف" : "Logo & cover"}</h3><p>{locale === "ar" ? "ارفع صورًا واضحة لأنهما أول ما يراه العميل في موقعك." : "Upload clear brand assets — they are the first thing customers see."}</p></div><Palette /></div>
          <div className="form-grid two"><MediaUploader resourceType="image" folder="tijvorya/stores" value={logo} onChange={setLogo} maxMB={5} label={locale === "ar" ? "شعار المتجر" : "Store logo"} /><MediaUploader resourceType="image" folder="tijvorya/stores" value={cover} onChange={setCover} maxMB={8} label={locale === "ar" ? "صورة الغلاف" : "Website cover"} /></div>
        </section>
        <StoreThemeEditor locale={locale} store={previewStore} value={theme} onChange={setTheme} />
        <section className="onboarding-launch-card"><div><span><Rocket /></span><div><strong>{locale === "ar" ? "جاهز لإنشاء موقعك" : "Ready to build your website"}</strong><p>{locale === "ar" ? `الدومين المخصص لمتجرك: ${merchantDomain(generatedSlug || "your-store")}` : `Your dedicated store domain: ${merchantDomain(generatedSlug || "your-store")}`}</p></div></div><div className="onboarding-launch-checks"><span><BadgeCheck />{locale === "ar" ? "متجاوب مع الهاتف والكمبيوتر" : "Responsive on mobile and desktop"}</span><span><BadgeCheck />{locale === "ar" ? "هوية وألوان خاصة بالمتجر" : "Store-specific branding and colors"}</span><span><BadgeCheck />{locale === "ar" ? "منتجاتك تتحدث تلقائيًا" : "Products update automatically"}</span></div></section>
      </>}
    </div>

    <div className="onboarding-actions">
      <button type="button" className="button button-ghost" onClick={previous} disabled={step === 0 || saving}>{locale === "ar" ? <ArrowRight /> : <ArrowLeft />}{locale === "ar" ? "السابق" : "Back"}</button>
      <span>{locale === "ar" ? `الخطوة ${step + 1} من 4` : `Step ${step + 1} of 4`}</span>
      {step < 3 ? <button type="button" className="button button-dark" onClick={next}>{locale === "ar" ? "التالي" : "Continue"}{locale === "ar" ? <ArrowLeft /> : <ArrowRight />}</button> : <button type="button" className="button button-dark onboarding-launch-button" onClick={launch} disabled={saving}>{saving ? <LoaderCircle className="spin" /> : <Rocket />}{locale === "ar" ? "إنشاء الموقع وإطلاقه" : "Build & launch website"}</button>}
    </div>
  </div>;
}
