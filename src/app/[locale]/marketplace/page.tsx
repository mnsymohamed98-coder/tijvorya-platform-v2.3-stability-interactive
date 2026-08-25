"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/commerce/product-card";
import { PublicShell } from "@/components/layout/public-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { useApp } from "@/providers/app-provider";

export default function MarketplacePage() {
  const { locale, products, stores, favoriteIds } = useApp();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("featured");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get("q")?.trim();
    const initialCategory = params.get("category")?.trim();
    if (initialQuery) setQuery(initialQuery);
    if (initialCategory) setCategory(initialCategory);
    if (params.get("favorites") === "1") setFavoritesOnly(true);
  }, []);

  const activeStores = useMemo(() => stores.filter((store) => (store.status ?? "active") === "active"), [stores]);
  const activeStoreIds = useMemo(() => new Set(activeStores.map((store) => store.id)), [activeStores]);
  const storeById = useMemo(() => new Map(activeStores.map((store) => [store.id, store])), [activeStores]);
  const publicProducts = useMemo(() => products.filter((product) => product.status === "active" && activeStoreIds.has(product.storeId)), [products, activeStoreIds]);
  const categories = useMemo(() => ["all", ...Array.from(new Set(publicProducts.map((product) => product.category).filter(Boolean)))], [publicProducts]);
  const normalizedQuery = query.trim().toLocaleLowerCase(locale === "ar" ? "ar" : "en");

  const visible = useMemo(() => publicProducts
    .filter((product) => category === "all" || product.category === category)
    .filter((product) => !favoritesOnly || favoriteIds.includes(product.id))
    .filter((product) => !availableOnly || product.stock > 0)
    .filter((product) => {
      if (!normalizedQuery) return true;
      const store = storeById.get(product.storeId);
      const searchable = [product.name, product.nameEn, product.description, product.descriptionEn, product.category, store?.name, store?.nameEn].filter(Boolean).join(" ").toLocaleLowerCase(locale === "ar" ? "ar" : "en");
      return searchable.includes(normalizedQuery);
    })
    .sort((a, b) => sort === "price-low" ? a.price - b.price : sort === "price-high" ? b.price - a.price : sort === "rating" ? b.rating - a.rating : Number(b.featured) - Number(a.featured)), [publicProducts, category, favoritesOnly, favoriteIds, availableOnly, normalizedQuery, storeById, locale, sort]);

  const hasFilters = Boolean(query || category !== "all" || favoritesOnly || availableOnly || sort !== "featured");
  function resetFilters() { setQuery(""); setCategory("all"); setSort("featured"); setFavoritesOnly(false); setAvailableOnly(false); }

  return <PublicShell locale={locale}>
    <section className="page-hero compact"><div className="container"><span className="eyebrow">TIJVORYA MARKET</span><h1>{locale === "ar" ? "السوق" : "Marketplace"}</h1><p>{locale === "ar" ? "اكتشف منتجات ومتاجر موثوقة داخل تجربة شراء واحدة." : "Discover trusted products and stores inside one shopping experience."}</p></div></section>
    <section className="section container">
      <div className="market-toolbar">
        <label className="search-field"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={locale === "ar" ? "ابحث عن منتج أو متجر" : "Search products or stores"} aria-label={locale === "ar" ? "البحث في السوق" : "Search marketplace"} /></label>
        <label className="toolbar-select"><SlidersHorizontal /><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label={locale === "ar" ? "ترتيب النتائج" : "Sort results"}><option value="featured">{locale === "ar" ? "الأبرز" : "Featured"}</option><option value="rating">{locale === "ar" ? "الأعلى تقييمًا" : "Top rated"}</option><option value="price-low">{locale === "ar" ? "السعر: الأقل" : "Price: low"}</option><option value="price-high">{locale === "ar" ? "السعر: الأعلى" : "Price: high"}</option></select></label>
        <button type="button" className={`button button-ghost ${favoritesOnly ? "is-selected" : ""}`} onClick={() => setFavoritesOnly((value) => !value)} aria-pressed={favoritesOnly}>{locale === "ar" ? "المفضلة" : "Favorites"} ({favoriteIds.length})</button>
      </div>
      <div className="market-filter-row"><label className="filter-checkbox"><input type="checkbox" checked={availableOnly} onChange={(event) => setAvailableOnly(event.target.checked)} />{locale === "ar" ? "المتوفر فقط" : "In stock only"}</label></div>
      <div className="category-tabs" role="list" aria-label={locale === "ar" ? "تصنيفات المنتجات" : "Product categories"}>{categories.map((item) => <button type="button" key={item} className={category === item ? "is-active" : ""} onClick={() => setCategory(item)} aria-pressed={category === item}>{item === "all" ? (locale === "ar" ? "الكل" : "All") : item}</button>)}</div>
      <div className="results-line"><span><strong>{visible.length}</strong> {locale === "ar" ? "منتج" : "products"}</span>{hasFilters && <button type="button" onClick={resetFilters}><X /> {locale === "ar" ? "مسح الفلاتر" : "Clear filters"}</button>}</div>
      {visible.length ? <div className="product-grid">{visible.map((product) => <ProductCard key={product.id} product={product} store={storeById.get(product.storeId)} />)}</div> : <EmptyState title={locale === "ar" ? "لا توجد نتائج" : "No results"} text={locale === "ar" ? "جرّب كلمات أو تصنيفًا مختلفًا، أو ألغِ بعض الفلاتر." : "Try a different query, category or fewer filters."} />}
    </section>
  </PublicShell>;
}
