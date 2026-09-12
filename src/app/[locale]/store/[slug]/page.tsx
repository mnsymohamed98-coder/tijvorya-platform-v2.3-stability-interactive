"use client";

import Link from "next/link";
import { ArrowUpRight, BadgeCheck, Clock3, MapPin, PackageCheck, ShieldCheck, Star, Truck } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { ProductCard } from "@/components/commerce/product-card";
import { StorefrontFrame } from "@/components/storefront/storefront-frame";
import { StorefrontNotFound } from "@/components/storefront/storefront-not-found";
import { StorefrontLoading } from "@/components/storefront/storefront-loading";
import { PersistentImage } from "@/components/ui/persistent-media";
import { businessCategoryLabel, merchantStoreHref, normalizeStoreWebsiteProfile, whatsappHref } from "@/lib/store-website";
import { WhatsAppBrandIcon } from "@/components/ui/social-brand-icons";
import { normalizeStoreTheme } from "@/lib/store-theme";
import { loadStoreCatalog } from "@/lib/supabase/repository";
import { useApp } from "@/providers/app-provider";
import { chunk } from "@/lib/utils";

function decodeSlug(value: string) {
  try { return decodeURIComponent(value).trim().toLocaleLowerCase(); }
  catch { return value.trim().toLocaleLowerCase(); }
}

export default function StorePage() {
  const params = useParams<{ slug: string }>();
  const { locale, stores, products, reels, ready, productionMode, mergeProducts, resolveStoreBySlug } = useApp();
  const requestedSlug = decodeSlug(params.slug);
  const store = stores.find((item) => item.slug.trim().toLocaleLowerCase() === requestedSlug && (item.status ?? "active") === "active");

  // state.stores is a role-scoped workspace slice (a merchant only ever
  // sees their own store), not a full public directory - a miss here
  // doesn't mean the store doesn't exist, just that it's not in whatever
  // this viewer's role happened to load. Resolve it directly instead.
  useEffect(() => {
    if (store || !productionMode) return;
    void resolveStoreBySlug(requestedSlug);
  }, [store, requestedSlug, productionMode, resolveStoreBySlug]);

  // The shared `products` cache no longer holds every store's catalog - a
  // storefront fetches and merges its own, instead of filtering a global
  // array that may not contain this store's products at all.
  useEffect(() => {
    if (!store || !productionMode) return;
    let active = true;
    loadStoreCatalog(store.id).then((catalog) => { if (active) mergeProducts(catalog); }).catch(console.error);
    return () => { active = false; };
  }, [store, productionMode, mergeProducts]);

  // The header's Reels link points at this page's #store-reels anchor, but
  // that section only exists once the store's reels have hydrated - the
  // browser's own scroll-to-fragment on load fires before that, against an
  // element that isn't in the DOM yet, and never retries. Scroll manually
  // once the data (and therefore the section) actually shows up.
  useEffect(() => {
    if (!store || typeof window === "undefined" || window.location.hash !== "#store-reels") return;
    const hasStoreReels = reels.some((item) => item.storeId === store.id && item.status === "approved");
    if (!hasStoreReels) return;
    document.getElementById("store-reels")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [store, reels]);

  // Clicking the header's Reels link while already on this page changes the
  // hash without a navigation/re-render, so the effect above never re-fires
  // for that case - a hashchange listener catches it instead.
  useEffect(() => {
    function handleHashChange() {
      if (window.location.hash !== "#store-reels") return;
      document.getElementById("store-reels")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  if (!ready) return <StorefrontLoading />;
  if (!store) return <StorefrontNotFound />;

  const website = normalizeStoreWebsiteProfile(store.website);
  const theme = normalizeStoreTheme(store.theme, store.themeColor);
  const items = products.filter((item) => item.storeId === store.id && item.status === "active");
  const featuredAll = [...items.filter((item) => item.featured), ...items.filter((item) => !item.featured)];
  const featuredRows = chunk(featuredAll.slice(0, 32), 8);
  const hasMoreFeatured = featuredAll.length > 32;
  const itemIds = new Set(items.map((item) => item.id));
  const storeReels = reels.filter((item) => item.storeId === store.id && item.status === "approved" && itemIds.has(item.productId)).slice(0, 4);
  const categories = Array.from(new Set(items.map((item) => item.category).filter(Boolean))).slice(0, 6);
  const name = locale === "ar" ? store.name : store.nameEn;
  const tagline = (locale === "ar" ? website.tagline : website.taglineEn) || (locale === "ar" ? store.description : store.descriptionEn);
  const about = (locale === "ar" ? website.about : website.aboutEn) || (locale === "ar" ? store.description : store.descriptionEn);
  const productsHref = merchantStoreHref(store.slug, locale, "products");
  const aboutHref = merchantStoreHref(store.slug, locale, "about");

  const heroCategory = <span className="merchant-store-category">{businessCategoryLabel(website.businessCategory, locale)}</span>;
  const heroDescription = locale === "ar" ? store.description : store.descriptionEn;
  const heroActions = <div className="merchant-home-actions">
    <Link className="merchant-primary-button" href={productsHref}>{locale === "ar" ? "تصفح المنتجات" : "Shop products"}<ArrowUpRight /></Link>
    <Link className="merchant-secondary-button" href={aboutHref}>{locale === "ar" ? "تعرف علينا" : "Our story"}</Link>
  </div>;
  const heroTrust = <div className="merchant-home-trust">
    {store.verified && <span><BadgeCheck />{locale === "ar" ? "متجر موثوق" : "Verified store"}</span>}
    {store.rating > 0 && <span><Star fill="currentColor" />{store.rating.toFixed(1)}</span>}
    {store.city && <span><MapPin />{store.city}</span>}
  </div>;

  return <StorefrontFrame store={store} active="home">
    {theme.heroStyle === "cover" ? (
      <section className="merchant-home-hero merchant-home-hero-cover">
        <div className="merchant-home-hero-cover-media"><PersistentImage className="media-fill" src={store.cover} alt={name} optimized sizes="100vw" /><div className="merchant-home-hero-cover-shade" /></div>
        <div className="merchant-site-shell merchant-home-hero-cover-content">
          {heroCategory}
          <h1>{tagline || name}</h1>
          <p>{heroDescription}</p>
          {heroActions}
          {heroTrust}
        </div>
      </section>
    ) : theme.heroStyle === "minimal" ? (
      <section className="merchant-home-hero merchant-home-hero-minimal">
        <div className="merchant-site-shell merchant-home-hero-minimal-content">
          <span className="merchant-home-brand-logo standalone"><PersistentImage className="media-cover" src={store.logo} alt={name} optimized sizes="64px" /></span>
          {heroCategory}
          <h1>{tagline || name}</h1>
          <p>{heroDescription}</p>
          {heroActions}
          {heroTrust}
        </div>
      </section>
    ) : (
      <section className="merchant-home-hero">
        <div className="merchant-site-shell merchant-home-hero-grid">
          <div className="merchant-home-copy">
            {heroCategory}
            <h1>{tagline || name}</h1>
            <p>{heroDescription}</p>
            {heroActions}
            {heroTrust}
          </div>
          <div className="merchant-home-cover">
            <PersistentImage className="media-fill" src={store.cover} alt={name} optimized sizes="(max-width: 780px) 100vw, 50vw" />
            <div className="merchant-home-brand-card">
              <span className="merchant-home-brand-logo"><PersistentImage className="media-cover" src={store.logo} alt={name} optimized sizes="46px" /></span>
              <div><small>{locale === "ar" ? "تسوق مباشرة من" : "Shop directly from"}</small><strong>{name}</strong></div>
            </div>
          </div>
        </div>
      </section>
    )}

    <section className="merchant-site-benefits">
      <div className="merchant-site-shell merchant-benefit-grid">
        <article><ShieldCheck /><div><strong>{locale === "ar" ? "تجربة شراء واضحة" : "Clear shopping"}</strong><span>{locale === "ar" ? "منتجات ومعلومات مرتبة في مكان واحد" : "Products and details in one organized place"}</span></div></article>
        <article><Truck /><div><strong>{locale === "ar" ? "التوصيل" : "Delivery"}</strong><span>{website.shippingAreas || (locale === "ar" ? "راجع مناطق التوصيل مع المتجر" : "Check delivery areas with the store")}</span></div></article>
        <article><PackageCheck /><div><strong>{locale === "ar" ? "خدمة ما بعد البيع" : "After-sales service"}</strong><span>{website.returnPolicy || (locale === "ar" ? "تواصل مع المتجر لمعرفة سياسة الاستبدال" : "Contact the store for the returns policy")}</span></div></article>
        <article><Clock3 /><div><strong>{locale === "ar" ? "ساعات العمل" : "Business hours"}</strong><span>{website.openingHours || (locale === "ar" ? "متاح حسب أوقات عمل المتجر" : "Available during store business hours")}</span></div></article>
      </div>
    </section>

    <section className="merchant-site-section merchant-site-shell">
      <div className="merchant-section-heading"><div><span>{locale === "ar" ? "مختارات المتجر" : "Store picks"}</span><h2>{locale === "ar" ? "منتجات تستحق الاكتشاف" : "Products worth discovering"}</h2></div><Link href={productsHref}>{locale === "ar" ? "عرض الكل" : "View all"}<ArrowUpRight /></Link></div>
      {featuredAll.length > 0 ? <div className="product-rows">{featuredRows.map((row, index) => <div className="product-grid merchant-featured-grid store-product-grid product-carousel" key={index}>{row.map((item) => <ProductCard key={item.id} product={item} />)}</div>)}{hasMoreFeatured && <Link className="product-rows-more" href={productsHref}>{locale === "ar" ? "استكشف باقي المنتجات" : "Explore the rest of the products"}<ArrowUpRight /></Link>}</div> : <div className="merchant-site-empty"><PackageCheck /><h3>{locale === "ar" ? "المنتجات قادمة قريبًا" : "Products are coming soon"}</h3><p>{locale === "ar" ? "يعمل المتجر حاليًا على تجهيز مجموعته الأولى." : "The store is preparing its first collection."}</p></div>}
    </section>

    {categories.length > 0 && <section className="merchant-category-band"><div className="merchant-site-shell"><div className="merchant-section-heading compact"><div><span>{locale === "ar" ? "الأقسام" : "Categories"}</span><h2>{locale === "ar" ? "تسوق حسب القسم" : "Shop by category"}</h2></div></div><div className="merchant-category-grid">{categories.map((category, index) => <Link href={`${productsHref}?category=${encodeURIComponent(category)}`} key={category}><div className="merchant-category-top"><small>{String(index + 1).padStart(2, "0")}</small><ArrowUpRight /></div><strong>{category}</strong></Link>)}</div></div></section>}

    {storeReels.length > 0 && <section id="store-reels" className="merchant-site-section merchant-site-shell">
      <div className="merchant-section-heading"><div><span>REELS</span><h2>{locale === "ar" ? "شاهد المنتجات أثناء الاستخدام" : "See products in motion"}</h2></div><Link href={`/${locale}/reels`}>{locale === "ar" ? "مشاهدة الريلز" : "Watch reels"}<ArrowUpRight /></Link></div>
      <div className="merchant-reel-grid">{storeReels.map((item) => <Link key={item.id} href={`/${locale}/reels?reel=${encodeURIComponent(item.id)}`}><div><PersistentImage className="media-fill" src={item.cover} alt={locale === "ar" ? item.caption : item.captionEn} optimized sizes="(max-width: 780px) 100vw, (max-width: 1050px) 50vw, 25vw" /><span>{item.views.toLocaleString()} {locale === "ar" ? "مشاهدة" : "views"}</span></div></Link>)}</div>
    </section>}

    <section className="merchant-story-section">
      <div className="merchant-site-shell merchant-story-grid">
        <div><span className="merchant-store-category">{locale === "ar" ? "قصتنا" : "Our story"}</span><h2>{locale === "ar" ? `تعرف أكثر على ${name}` : `Get to know ${name}`}</h2><p>{about}</p><Link className="merchant-secondary-button" href={aboutHref}>{locale === "ar" ? "المزيد عن المتجر" : "More about us"}<ArrowUpRight /></Link></div>
        <div className="merchant-story-card"><span>{locale === "ar" ? "من موقعنا" : "Based in"}</span><strong>{[website.address, store.city, website.country].filter(Boolean).join(" · ")}</strong>{store.whatsapp && <a href={whatsappHref(store.whatsapp)} target="_blank" rel="noopener noreferrer"><WhatsAppBrandIcon />{locale === "ar" ? "اسأل المتجر عبر واتساب" : "Ask the store on WhatsApp"}</a>}</div>
      </div>
    </section>
  </StorefrontFrame>;
}
