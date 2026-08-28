"use client";

import Link from "next/link";
import { ArrowUpRight, BadgeCheck, Clock3, MapPin, MessageCircle, PackageCheck, ShieldCheck, Star, Truck } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { ProductCard } from "@/components/commerce/product-card";
import { StorefrontFrame } from "@/components/storefront/storefront-frame";
import { StorefrontNotFound } from "@/components/storefront/storefront-not-found";
import { StorefrontLoading } from "@/components/storefront/storefront-loading";
import { PersistentImage } from "@/components/ui/persistent-media";
import { businessCategoryLabel, merchantStoreHref, normalizeStoreWebsiteProfile } from "@/lib/store-website";
import { loadStoreCatalog } from "@/lib/supabase/repository";
import { useApp } from "@/providers/app-provider";

function decodeSlug(value: string) {
  try { return decodeURIComponent(value).trim().toLocaleLowerCase(); }
  catch { return value.trim().toLocaleLowerCase(); }
}

export default function StorePage() {
  const params = useParams<{ slug: string }>();
  const { locale, stores, products, reels, platformSettings, ready, productionMode, mergeProducts, resolveStoreBySlug } = useApp();
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

  if (!ready) return <StorefrontLoading />;
  if (!store) return <StorefrontNotFound />;

  const website = normalizeStoreWebsiteProfile(store.website);
  const items = products.filter((item) => item.storeId === store.id && item.status === "active");
  const featured = [...items.filter((item) => item.featured), ...items.filter((item) => !item.featured)].slice(0, 4);
  const itemIds = new Set(items.map((item) => item.id));
  const storeReels = reels.filter((item) => item.storeId === store.id && item.status === "approved" && itemIds.has(item.productId)).slice(0, 4);
  const categories = Array.from(new Set(items.map((item) => item.category).filter(Boolean))).slice(0, 6);
  const name = locale === "ar" ? store.name : store.nameEn;
  const tagline = (locale === "ar" ? website.tagline : website.taglineEn) || (locale === "ar" ? store.description : store.descriptionEn);
  const about = (locale === "ar" ? website.about : website.aboutEn) || (locale === "ar" ? store.description : store.descriptionEn);
  const productsHref = merchantStoreHref(store.slug, locale, "products");
  const aboutHref = merchantStoreHref(store.slug, locale, "about");

  return <StorefrontFrame store={store} active="home">
    <section className="merchant-home-hero">
      <div className="merchant-site-shell merchant-home-hero-grid">
        <div className="merchant-home-copy">
          <span className="merchant-store-category">{businessCategoryLabel(website.businessCategory, locale)}</span>
          <h1>{tagline || name}</h1>
          <p>{locale === "ar" ? store.description : store.descriptionEn}</p>
          <div className="merchant-home-actions">
            <Link className="merchant-primary-button" href={productsHref}>{locale === "ar" ? "تصفح المنتجات" : "Shop products"}<ArrowUpRight /></Link>
            <Link className="merchant-secondary-button" href={aboutHref}>{locale === "ar" ? "تعرف علينا" : "Our story"}</Link>
          </div>
          <div className="merchant-home-trust">
            {store.verified && <span><BadgeCheck />{locale === "ar" ? "متجر موثوق" : "Verified store"}</span>}
            {store.rating > 0 && <span><Star fill="currentColor" />{store.rating.toFixed(1)}</span>}
            {store.city && <span><MapPin />{store.city}</span>}
          </div>
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
      {featured.length > 0 ? <div className="product-grid merchant-featured-grid">{featured.map((item) => <ProductCard key={item.id} product={item} />)}</div> : <div className="merchant-site-empty"><PackageCheck /><h3>{locale === "ar" ? "المنتجات قادمة قريبًا" : "Products are coming soon"}</h3><p>{locale === "ar" ? "يعمل المتجر حاليًا على تجهيز مجموعته الأولى." : "The store is preparing its first collection."}</p></div>}
    </section>

    {categories.length > 0 && <section className="merchant-category-band"><div className="merchant-site-shell"><div className="merchant-section-heading compact"><div><span>{locale === "ar" ? "الأقسام" : "Categories"}</span><h2>{locale === "ar" ? "تسوق حسب القسم" : "Shop by category"}</h2></div></div><div className="merchant-category-grid">{categories.map((category, index) => <Link href={`${productsHref}?category=${encodeURIComponent(category)}`} key={category}><small>{String(index + 1).padStart(2, "0")}</small><strong>{category}</strong><ArrowUpRight /></Link>)}</div></div></section>}

    {storeReels.length > 0 && <section className="merchant-site-section merchant-site-shell">
      <div className="merchant-section-heading"><div><span>REELS</span><h2>{locale === "ar" ? "شاهد المنتجات أثناء الاستخدام" : "See products in motion"}</h2></div><Link href={`/${locale}/reels`}>{locale === "ar" ? "مشاهدة الريلز" : "Watch reels"}<ArrowUpRight /></Link></div>
      <div className="merchant-reel-grid">{storeReels.map((item) => <Link key={item.id} href={`/${locale}/product/${encodeURIComponent(item.productId)}`}><div><PersistentImage className="media-fill" src={item.cover} alt={locale === "ar" ? item.caption : item.captionEn} optimized sizes="(max-width: 780px) 100vw, (max-width: 1050px) 50vw, 25vw" /><span>{item.views.toLocaleString()} {locale === "ar" ? "مشاهدة" : "views"}</span></div><strong>{locale === "ar" ? item.caption : item.captionEn}</strong></Link>)}</div>
    </section>}

    <section className="merchant-story-section">
      <div className="merchant-site-shell merchant-story-grid">
        <div><span className="merchant-store-category">{locale === "ar" ? "قصتنا" : "Our story"}</span><h2>{locale === "ar" ? `تعرف أكثر على ${name}` : `Get to know ${name}`}</h2><p>{about}</p><Link className="merchant-secondary-button" href={aboutHref}>{locale === "ar" ? "المزيد عن المتجر" : "More about us"}<ArrowUpRight /></Link></div>
        <div className="merchant-story-card"><span>{locale === "ar" ? "من موقعنا" : "Based in"}</span><strong>{[website.address, store.city, website.country].filter(Boolean).join(" · ")}</strong>{platformSettings.messagingEnabled && <Link href={`/${locale}/messages?store=${encodeURIComponent(store.slug)}`}><MessageCircle />{locale === "ar" ? "اسأل المتجر مباشرة" : "Ask the store directly"}</Link>}</div>
      </div>
    </section>
  </StorefrontFrame>;
}
