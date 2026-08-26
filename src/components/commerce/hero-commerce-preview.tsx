"use client";

import { Film, LayoutGrid, Package, Play, Store as StoreIcon } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { PersistentImage } from "@/components/ui/persistent-media";
import { formatMoney } from "@/lib/utils";
import type { Locale, Product, Reel, Store } from "@/types";

type PreviewMode = "products" | "stores" | "reels";

export function HeroCommercePreview({ locale, products, stores, reels, stats }: { locale: Locale; products: Product[]; stores: Store[]; reels: Reel[]; stats: { stores: number; products: number; reels: number } }) {
  const [mode, setMode] = useState<PreviewMode>("products");
  const tabs = locale === "ar"
    ? [{ id: "products" as const, label: "المنتجات" }, { id: "stores" as const, label: "المتاجر" }, { id: "reels" as const, label: "الريلز" }]
    : [{ id: "products" as const, label: "Products" }, { id: "stores" as const, label: "Stores" }, { id: "reels" as const, label: "Reels" }];

  const visibleProducts = useMemo(() => products.slice(0, 3), [products]);
  const visibleStores = useMemo(() => stores.slice(0, 4), [stores]);
  const visibleReels = useMemo(() => reels.slice(0, 3), [reels]);

  return <div className="hero-live-preview" aria-label={locale === "ar" ? "معاينة حية لمنصة Tijvorya" : "Live Tijvorya platform preview"}>
    <div className="hero-live-topbar">
      <div className="hero-live-window-dots" aria-hidden="true"><i /><i /><i /></div>
      <div className="hero-live-tabs" role="tablist" aria-label={locale === "ar" ? "أقسام المعاينة" : "Preview sections"}>
        {tabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={mode === tab.id} className={mode === tab.id ? "is-active" : ""} onClick={() => setMode(tab.id)}>{tab.label}</button>)}
      </div>
      <span className="hero-live-status"><i />{locale === "ar" ? "بيانات حقيقية" : "Live data"}</span>
    </div>

    <div className="hero-live-body">
      <aside className="hero-live-sidebar" aria-hidden="true">
        <span className="is-active"><LayoutGrid /></span><span><Package /></span><span><Film /></span><span><StoreIcon /></span>
      </aside>

      <div className="hero-live-content">
        <div className="hero-live-summary">
          <div><small>{locale === "ar" ? "متاجر جاهزة" : "Ready stores"}</small><strong>{stats.stores}</strong></div>
          <div><small>{locale === "ar" ? "منتجات منشورة" : "Published products"}</small><strong>{stats.products}</strong></div>
          <div><small>{locale === "ar" ? "ريلز منشورة" : "Published reels"}</small><strong>{stats.reels}</strong></div>
        </div>

        {mode === "products" && <section className="hero-live-panel" role="tabpanel">
          <header><div><span>{locale === "ar" ? "الكتالوج" : "CATALOG"}</span><h3>{locale === "ar" ? "منتجات منشورة الآن" : "Products published now"}</h3></div><Package /></header>
          {visibleProducts.length > 0 ? <div className="hero-live-product-grid">{visibleProducts.map((product) => <article key={product.id}><div>{product.image ? <PersistentImage className="media-fill" src={product.image} alt={locale === "ar" ? product.name : product.nameEn} optimized sizes="200px" /> : <Package />}</div><strong>{locale === "ar" ? product.name : product.nameEn}</strong><span>{formatMoney(product.price, locale)}</span></article>)}</div> : <PreviewEmpty icon={<Package />} text={locale === "ar" ? "ستظهر المنتجات الحقيقية هنا بعد نشرها." : "Real products will appear here after publishing."} />}
        </section>}

        {mode === "stores" && <section className="hero-live-panel" role="tabpanel">
          <header><div><span>{locale === "ar" ? "شبكة المتاجر" : "STORE NETWORK"}</span><h3>{locale === "ar" ? "هويات تجارية جاهزة" : "Launch-ready brand identities"}</h3></div><StoreIcon /></header>
          {visibleStores.length > 0 ? <div className="hero-live-store-grid">{visibleStores.map((store) => <article key={store.id}><div><PersistentImage className="media-cover" src={store.logo} alt={locale === "ar" ? store.name : store.nameEn} optimized width={50} height={50} /></div><span><strong>{locale === "ar" ? store.name : store.nameEn}</strong><small>{store.website?.domain || `${store.slug}.tijvorya.com`}</small></span></article>)}</div> : <PreviewEmpty icon={<StoreIcon />} text={locale === "ar" ? "ستظهر المتاجر الجاهزة هنا تلقائيًا." : "Launch-ready stores will appear here automatically."} />}
        </section>}

        {mode === "reels" && <section className="hero-live-panel" role="tabpanel">
          <header><div><span>REELS</span><h3>{locale === "ar" ? "محتوى قابل للشراء" : "Shoppable content"}</h3></div><Film /></header>
          {visibleReels.length > 0 ? <div className="hero-live-reel-grid">{visibleReels.map((reel) => <article key={reel.id}><div><PersistentImage className="media-fill" src={reel.cover} alt={locale === "ar" ? reel.caption : reel.captionEn} optimized sizes="200px" /><span><Play /></span></div><strong>{locale === "ar" ? reel.caption : reel.captionEn}</strong></article>)}</div> : <PreviewEmpty icon={<Film />} text={locale === "ar" ? "ستظهر الريلز المعتمدة هنا بعد نشرها." : "Approved reels will appear here once published."} />}
        </section>}
      </div>
    </div>
  </div>;
}

function PreviewEmpty({ icon, text }: { icon: ReactNode; text: string }) {
  return <div className="hero-live-empty">{icon}<span>{text}</span></div>;
}
