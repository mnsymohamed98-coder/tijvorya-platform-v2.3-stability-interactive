"use client";

import Link from "next/link";
import { BadgeCheck, Clock3, Mail, MapPin, MessageCircle, Music2, PackageCheck, Phone, ShieldCheck, Truck } from "lucide-react";
import { FacebookBrandIcon, InstagramBrandIcon } from "@/components/ui/social-brand-icons";
import { useParams } from "next/navigation";
import { StorefrontFrame } from "@/components/storefront/storefront-frame";
import { StorefrontNotFound } from "@/components/storefront/storefront-not-found";
import { StorefrontLoading } from "@/components/storefront/storefront-loading";
import { businessCategoryLabel, normalizeStoreWebsiteProfile, safeExternalUrl } from "@/lib/store-website";
import { useApp } from "@/providers/app-provider";

function decodeSlug(value: string) {
  try { return decodeURIComponent(value).trim().toLocaleLowerCase(); }
  catch { return value.trim().toLocaleLowerCase(); }
}

function cleanPhone(value?: string) { return value?.replace(/[^+\d]/g, ""); }
function cleanWhatsapp(value?: string) { return value?.replace(/\D/g, ""); }

export default function AboutPage() {
  const params = useParams<{ slug: string }>();
  const { locale, stores, platformSettings, ready } = useApp();
  const store = stores.find((item) => item.slug.trim().toLocaleLowerCase() === decodeSlug(params.slug) && (item.status ?? "active") === "active");
  if (!ready) return <StorefrontLoading />;
  if (!store) return <StorefrontNotFound />;

  const website = normalizeStoreWebsiteProfile(store.website);
  const name = locale === "ar" ? store.name : store.nameEn;
  const about = (locale === "ar" ? website.about : website.aboutEn) || (locale === "ar" ? store.description : store.descriptionEn);
  const tagline = (locale === "ar" ? website.tagline : website.taglineEn) || (locale === "ar" ? store.description : store.descriptionEn);
  const instagram = safeExternalUrl(website.instagram);
  const facebook = safeExternalUrl(website.facebook);
  const tiktok = safeExternalUrl(website.tiktok);

  return <StorefrontFrame store={store} active="about">
    <section className="merchant-page-hero merchant-about-hero">
      <div className="merchant-site-shell"><span>{businessCategoryLabel(website.businessCategory, locale)}</span><h1>{locale === "ar" ? `عن ${name}` : `About ${name}`}</h1><p>{tagline}</p></div>
    </section>

    <section className="merchant-site-section merchant-site-shell">
      <div className="merchant-about-intro">
        <div><span className="merchant-store-category">{locale === "ar" ? "من نحن" : "Who we are"}</span><h2>{locale === "ar" ? "علامة تجارية تهتم بالتجربة قبل المنتج وبعده" : "A brand focused on the full customer experience"}</h2></div>
        <div><p>{about}</p>{store.verified && <span className="merchant-verified-note"><BadgeCheck />{locale === "ar" ? "هذا المتجر موثوق على منصة Tijvorya" : "This merchant is verified on Tijvorya"}</span>}</div>
      </div>
    </section>

    {(website.legalName || website.registrationNumber || website.domain) && <section className="merchant-site-section merchant-site-shell">
      <div className="merchant-business-identity">
        <div><span>{locale === "ar" ? "الهوية التجارية" : "Business identity"}</span><strong>{website.legalName || name}</strong></div>
        {website.registrationNumber && <div><span>{locale === "ar" ? "رقم التسجيل / الترخيص" : "Registration / license"}</span><strong dir="ltr">{website.registrationNumber}</strong></div>}
        <div><span>{locale === "ar" ? "الموقع الرسمي" : "Official website"}</span><strong dir="ltr">{website.domain || `${store.slug}.tijvorya.com`}</strong></div>
      </div>
    </section>}

    <section className="merchant-about-facts">
      <div className="merchant-site-shell merchant-about-fact-grid">
        <article><MapPin /><span>{locale === "ar" ? "الموقع" : "Location"}</span><strong>{[website.address, store.city, website.country].filter(Boolean).join(" · ") || (locale === "ar" ? "تواصل مع المتجر" : "Contact the store")}</strong></article>
        <article><Clock3 /><span>{locale === "ar" ? "ساعات العمل" : "Business hours"}</span><strong>{website.openingHours || (locale === "ar" ? "حسب مواعيد المتجر" : "According to store schedule")}</strong></article>
        <article><Truck /><span>{locale === "ar" ? "مناطق التوصيل" : "Delivery areas"}</span><strong>{website.shippingAreas || (locale === "ar" ? "اسأل المتجر عن منطقتك" : "Ask the store about your area")}</strong></article>
        <article><PackageCheck /><span>{locale === "ar" ? "الاستبدال والإرجاع" : "Returns & exchanges"}</span><strong>{website.returnPolicy || (locale === "ar" ? "تطبق سياسة المتجر" : "Store policy applies")}</strong></article>
      </div>
    </section>

    <section className="merchant-site-section merchant-site-shell">
      <div className="merchant-contact-grid">
        <div className="merchant-contact-copy"><span className="merchant-store-category">{locale === "ar" ? "تواصل" : "Contact"}</span><h2>{locale === "ar" ? "نحن هنا للإجابة عن أسئلتك" : "We are here to answer your questions"}</h2><p>{locale === "ar" ? "استخدم وسيلة التواصل المناسبة لك للاستفسار عن المنتجات، الطلبات أو التوصيل." : "Choose the contact channel that works for you for products, orders or delivery questions."}</p></div>
        <div className="merchant-contact-cards">
          {website.businessEmail && <a href={`mailto:${website.businessEmail}`}><Mail /><div><span>{locale === "ar" ? "البريد" : "Email"}</span><strong>{website.businessEmail}</strong></div></a>}
          {store.phone && <a href={`tel:${cleanPhone(store.phone)}`}><Phone /><div><span>{locale === "ar" ? "الهاتف" : "Phone"}</span><strong>{store.phone}</strong></div></a>}
          {store.whatsapp && <a href={`https://wa.me/${cleanWhatsapp(store.whatsapp)}`} target="_blank" rel="noopener noreferrer"><MessageCircle /><div><span>WhatsApp</span><strong>{locale === "ar" ? "ابدأ محادثة" : "Start a chat"}</strong></div></a>}
          {platformSettings.messagingEnabled && <Link href={`/${locale}/messages?store=${encodeURIComponent(store.slug)}`}><ShieldCheck /><div><span>Tijvorya</span><strong>{locale === "ar" ? "مراسلة آمنة داخل المنصة" : "Message securely on platform"}</strong></div></Link>}
        </div>
      </div>
      {(instagram || facebook || tiktok) && <div className="merchant-social-row"><span>{locale === "ar" ? "تابع المتجر" : "Follow the store"}</span>{instagram && <a href={instagram} target="_blank" rel="noopener noreferrer"><InstagramBrandIcon />Instagram</a>}{facebook && <a href={facebook} target="_blank" rel="noopener noreferrer"><FacebookBrandIcon />Facebook</a>}{tiktok && <a href={tiktok} target="_blank" rel="noopener noreferrer"><Music2 />TikTok</a>}</div>}
    </section>
  </StorefrontFrame>;
}
