"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/commerce/product-card";
import { StorefrontFrame } from "@/components/storefront/storefront-frame";
import { StorefrontNotFound } from "@/components/storefront/storefront-not-found";
import { StorefrontLoading } from "@/components/storefront/storefront-loading";
import { loadStoreCatalog } from "@/lib/supabase/repository";
import { useApp } from "@/providers/app-provider";

function decodeSlug(value: string) {
  try { return decodeURIComponent(value).trim().toLocaleLowerCase(); }
  catch { return value.trim().toLocaleLowerCase(); }
}

function ProductsContent() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const { locale, stores, products, ready, productionMode, mergeProducts, resolveStoreBySlug } = useApp();
  const requestedSlug = decodeSlug(params.slug);
  const store = stores.find((item) => item.slug.trim().toLocaleLowerCase() === requestedSlug && (item.status ?? "active") === "active");
  const initialCategory = searchParams.get("category") ?? "all";
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState("featured");

  // state.stores is role-scoped (a merchant only sees their own store), not
  // a full public directory - resolve directly on a miss instead of
  // assuming the store doesn't exist.
  useEffect(() => {
    if (store || !productionMode) return;
    void resolveStoreBySlug(requestedSlug);
  }, [store, requestedSlug, productionMode, resolveStoreBySlug]);

  useEffect(() => {
    if (!store || !productionMode) return;
    let active = true;
    loadStoreCatalog(store.id).then((catalog) => { if (active) mergeProducts(catalog); }).catch(console.error);
    return () => { active = false; };
  }, [store, productionMode, mergeProducts]);

  const storeProducts = useMemo(() => products.filter((item) => item.storeId === store?.id && item.status === "active"), [products, store?.id]);
  const categories = useMemo(() => Array.from(new Set(storeProducts.map((item) => item.category).filter(Boolean))), [storeProducts]);
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const list = storeProducts.filter((item) => {
      const matchesCategory = category === "all" || item.category === category;
      const haystack = `${item.name} ${item.nameEn} ${item.description} ${item.descriptionEn} ${item.category}`.toLocaleLowerCase();
      return matchesCategory && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
    return [...list].sort((a, b) => {
      if (sort === "price-low") return a.price - b.price;
      if (sort === "price-high") return b.price - a.price;
      if (sort === "rating") return b.rating - a.rating;
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    });
  }, [storeProducts, category, query, sort]);

  if (!ready) return <StorefrontLoading />;
  if (!store) return <StorefrontNotFound />;

  return <StorefrontFrame store={store} active="products">
    <section className="merchant-page-hero">
      <div className="merchant-site-shell"><span>{locale === "ar" ? "كتالوج المتجر" : "Store catalog"}</span><h1>{locale === "ar" ? "جميع المنتجات" : "All products"}</h1><p>{locale === "ar" ? "تصفح المجموعة كاملة، ابحث بالاسم أو فلتر المنتجات حسب القسم." : "Browse the full collection, search by name or filter products by category."}</p></div>
    </section>

    <section className="merchant-site-section merchant-site-shell merchant-products-page">
      <div className="merchant-catalog-toolbar">
        <label className="merchant-catalog-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={locale === "ar" ? "ابحث عن منتج..." : "Search products..."} /></label>
        <label className="merchant-catalog-sort"><SlidersHorizontal /><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label={locale === "ar" ? "ترتيب المنتجات" : "Sort products"}><option value="featured">{locale === "ar" ? "المميزة أولًا" : "Featured first"}</option><option value="rating">{locale === "ar" ? "الأعلى تقييمًا" : "Highest rated"}</option><option value="price-low">{locale === "ar" ? "السعر: من الأقل" : "Price: low to high"}</option><option value="price-high">{locale === "ar" ? "السعر: من الأعلى" : "Price: high to low"}</option></select></label>
      </div>
      <div className="merchant-category-tabs">
        <button className={category === "all" ? "is-active" : ""} onClick={() => setCategory("all")}>{locale === "ar" ? "الكل" : "All"}<b>{storeProducts.length}</b></button>
        {categories.map((item) => <button key={item} className={category === item ? "is-active" : ""} onClick={() => setCategory(item)}>{item}<b>{storeProducts.filter((product) => product.category === item).length}</b></button>)}
      </div>
      <div className="merchant-results-line"><strong>{filtered.length}</strong> {locale === "ar" ? "منتج" : filtered.length === 1 ? "product" : "products"}</div>
      {filtered.length > 0 ? <div className="product-grid merchant-catalog-grid">{filtered.map((item) => <ProductCard key={item.id} product={item} />)}</div> : <div className="merchant-site-empty"><Search /><h3>{locale === "ar" ? "لم نجد منتجات مطابقة" : "No matching products"}</h3><p>{locale === "ar" ? "جرّب كلمة بحث أخرى أو اختر قسمًا مختلفًا." : "Try another search term or choose a different category."}</p><button className="merchant-secondary-button" onClick={() => { setQuery(""); setCategory("all"); }}>{locale === "ar" ? "إعادة ضبط البحث" : "Reset filters"}</button></div>}
    </section>
  </StorefrontFrame>;
}

export default function ProductsPage() {
  return <Suspense fallback={<div className="merchant-site-loading" />}> <ProductsContent /> </Suspense>;
}
