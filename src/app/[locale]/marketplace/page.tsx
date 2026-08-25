"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/commerce/product-card";
import { PublicShell } from "@/components/layout/public-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { useApp } from "@/providers/app-provider";
import { loadPublicCategories, searchPublicProducts, type PublicProductSort } from "@/lib/supabase/repository";
import type { Product } from "@/types";

const PAGE_SIZE = 24;

export default function MarketplacePage() {
  const { locale, products, stores, favoriteIds, productionMode, mergeProducts } = useApp();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<PublicProductSort>("featured");
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

  // Production: server-driven search + pagination (searchPublicProducts /
  // loadPublicCategories) instead of filtering the full products array -
  // that array is no longer fetched in full at all (see loadPublicData()).
  const [liveCategories, setLiveCategories] = useState<string[]>([]);
  const [liveResults, setLiveResults] = useState<Product[]>([]);
  const [liveTotal, setLiveTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!productionMode) return;
    let active = true;
    loadPublicCategories().then((items) => { if (active) setLiveCategories(items); }).catch(console.error);
    return () => { active = false; };
  }, [productionMode]);

  // Query changes debounce ~300ms (typing); category/sort refetch immediately.
  useEffect(() => {
    if (!productionMode) return;
    let active = true;
    const delay = query ? 300 : 0;
    const timer = window.setTimeout(() => {
      searchPublicProducts({ query, category, sort, page: 0, pageSize: PAGE_SIZE })
        .then(({ products: found, total }) => {
          if (!active) return;
          setLiveResults(found);
          setLiveTotal(total);
          setPage(0);
          mergeProducts(found);
        })
        .catch(console.error);
    }, delay);
    return () => { active = false; window.clearTimeout(timer); };
  }, [query, category, sort, productionMode, mergeProducts]);

  function loadMore() {
    const nextPage = page + 1;
    setLoadingMore(true);
    searchPublicProducts({ query, category, sort, page: nextPage, pageSize: PAGE_SIZE })
      .then(({ products: found, total }) => {
        setLiveResults((previous) => [...previous, ...found]);
        setLiveTotal(total);
        setPage(nextPage);
        mergeProducts(found);
      })
      .catch(console.error)
      .finally(() => setLoadingMore(false));
  }

  // Demo mode (no Supabase): fall back to filtering the locally-seeded
  // products array exactly as this page used to, for every visitor.
  const demoProducts = useMemo(() => products.filter((product) => product.status === "active" && activeStoreIds.has(product.storeId)), [products, activeStoreIds]);
  const demoCategories = useMemo(() => Array.from(new Set(demoProducts.map((product) => product.category).filter(Boolean))), [demoProducts]);
  const normalizedQuery = query.trim().toLocaleLowerCase(locale === "ar" ? "ar" : "en");
  const demoResults = useMemo(() => demoProducts
    .filter((product) => category === "all" || product.category === category)
    .filter((product) => {
      if (!normalizedQuery) return true;
      const store = storeById.get(product.storeId);
      const searchable = [product.name, product.nameEn, product.description, product.descriptionEn, product.category, store?.name, store?.nameEn].filter(Boolean).join(" ").toLocaleLowerCase(locale === "ar" ? "ar" : "en");
      return searchable.includes(normalizedQuery);
    })
    .sort((a, b) => sort === "price-low" ? a.price - b.price : sort === "price-high" ? b.price - a.price : sort === "rating" ? b.rating - a.rating : Number(b.featured) - Number(a.featured)),
    [demoProducts, category, normalizedQuery, storeById, locale, sort]);

  const categories = productionMode ? liveCategories : demoCategories;
  const baseResults = productionMode ? liveResults : demoResults;
  const total = productionMode ? liveTotal : demoResults.length;
  const hasMore = productionMode && liveResults.length < liveTotal;

  // Favorites/in-stock filters apply to whatever's already loaded, not the
  // server query - a disclosed tradeoff, not silent data loss (the "N
  // products" count above still reflects the true total match count).
  const visible = useMemo(() => baseResults
    .filter((product) => !favoritesOnly || favoriteIds.includes(product.id))
    .filter((product) => !availableOnly || product.stock > 0), [baseResults, favoritesOnly, favoriteIds, availableOnly]);

  const hasFilters = Boolean(query || category !== "all" || favoritesOnly || availableOnly || sort !== "featured");
  function resetFilters() { setQuery(""); setCategory("all"); setSort("featured"); setFavoritesOnly(false); setAvailableOnly(false); }

  return <PublicShell locale={locale}>
    <section className="page-hero compact"><div className="container"><span className="eyebrow">TIJVORYA MARKET</span><h1>{locale === "ar" ? "السوق" : "Marketplace"}</h1><p>{locale === "ar" ? "اكتشف منتجات ومتاجر موثوقة داخل تجربة شراء واحدة." : "Discover trusted products and stores inside one shopping experience."}</p></div></section>
    <section className="section container">
      <div className="market-toolbar">
        <label className="search-field"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={locale === "ar" ? "ابحث عن منتج أو متجر" : "Search products or stores"} aria-label={locale === "ar" ? "البحث في السوق" : "Search marketplace"} /></label>
        <label className="toolbar-select"><SlidersHorizontal /><select value={sort} onChange={(event) => setSort(event.target.value as PublicProductSort)} aria-label={locale === "ar" ? "ترتيب النتائج" : "Sort results"}><option value="featured">{locale === "ar" ? "الأبرز" : "Featured"}</option><option value="rating">{locale === "ar" ? "الأعلى تقييمًا" : "Top rated"}</option><option value="price-low">{locale === "ar" ? "السعر: الأقل" : "Price: low"}</option><option value="price-high">{locale === "ar" ? "السعر: الأعلى" : "Price: high"}</option></select></label>
        <button type="button" className={`button button-ghost ${favoritesOnly ? "is-selected" : ""}`} onClick={() => setFavoritesOnly((value) => !value)} aria-pressed={favoritesOnly}>{locale === "ar" ? "المفضلة" : "Favorites"} ({favoriteIds.length})</button>
      </div>
      <div className="market-filter-row"><label className="filter-checkbox"><input type="checkbox" checked={availableOnly} onChange={(event) => setAvailableOnly(event.target.checked)} />{locale === "ar" ? "المتوفر فقط" : "In stock only"}</label></div>
      <div className="category-tabs" role="list" aria-label={locale === "ar" ? "تصنيفات المنتجات" : "Product categories"}>
        <button type="button" className={category === "all" ? "is-active" : ""} onClick={() => setCategory("all")} aria-pressed={category === "all"}>{locale === "ar" ? "الكل" : "All"}</button>
        {categories.map((item) => <button type="button" key={item} className={category === item ? "is-active" : ""} onClick={() => setCategory(item)} aria-pressed={category === item}>{item}</button>)}
      </div>
      <div className="results-line"><span><strong>{total}</strong> {locale === "ar" ? "منتج" : "products"}</span>{hasFilters && <button type="button" onClick={resetFilters}><X /> {locale === "ar" ? "مسح الفلاتر" : "Clear filters"}</button>}</div>
      {visible.length ? <>
        <div className="product-grid">{visible.map((product) => <ProductCard key={product.id} product={product} store={storeById.get(product.storeId)} />)}</div>
        {hasMore && <button type="button" className="button button-ghost button-block" disabled={loadingMore} onClick={loadMore}>{loadingMore ? (locale === "ar" ? "جارٍ التحميل..." : "Loading...") : (locale === "ar" ? "تحميل المزيد" : "Load more")}</button>}
      </> : <EmptyState title={locale === "ar" ? "لا توجد نتائج" : "No results"} text={locale === "ar" ? "جرّب كلمات أو تصنيفًا مختلفًا، أو ألغِ بعض الفلاتر." : "Try a different query, category or fewer filters."} />}
    </section>
  </PublicShell>;
}
