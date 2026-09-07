"use client";

import { Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { StoreCard } from "@/components/commerce/store-card";
import { PublicShell } from "@/components/layout/public-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { useApp } from "@/providers/app-provider";
import { businessCategoryLabel } from "@/lib/store-website";
import { loadPublicStoreCategories, searchPublicStores } from "@/lib/supabase/repository";
import type { Store } from "@/types";

const PAGE_SIZE = 18;

export default function StoresDirectoryPage() {
  const { locale, stores, productionMode } = useApp();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const activeStores = useMemo(() => stores.filter((store) => (store.status ?? "active") === "active" && store.website?.onboardingCompleted === true && Boolean(store.logo)), [stores]);

  const [liveCategories, setLiveCategories] = useState<string[]>([]);
  const [liveResults, setLiveResults] = useState<Store[]>([]);
  const [liveTotal, setLiveTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!productionMode) return;
    let active = true;
    loadPublicStoreCategories().then((items) => { if (active) setLiveCategories(items); }).catch(console.error);
    return () => { active = false; };
  }, [productionMode]);

  useEffect(() => {
    if (!productionMode) return;
    let active = true;
    const delay = query ? 300 : 0;
    const timer = window.setTimeout(() => {
      searchPublicStores({ query, category, page: 0, pageSize: PAGE_SIZE })
        .then(({ stores: found, total }) => {
          if (!active) return;
          setLiveResults(found);
          setLiveTotal(total);
          setPage(0);
        })
        .catch(console.error);
    }, delay);
    return () => { active = false; window.clearTimeout(timer); };
  }, [query, category, productionMode]);

  function loadMore() {
    const nextPage = page + 1;
    setLoadingMore(true);
    searchPublicStores({ query, category, page: nextPage, pageSize: PAGE_SIZE })
      .then(({ stores: found, total }) => {
        setLiveResults((previous) => [...previous, ...found]);
        setLiveTotal(total);
        setPage(nextPage);
      })
      .catch(console.error)
      .finally(() => setLoadingMore(false));
  }

  const demoCategories = useMemo(() => Array.from(new Set(activeStores.map((store) => store.website?.businessCategory).filter((value): value is string => Boolean(value)))), [activeStores]);
  const normalizedQuery = query.trim().toLocaleLowerCase(locale === "ar" ? "ar" : "en");
  const demoResults = useMemo(() => activeStores
    .filter((store) => category === "all" || store.website?.businessCategory === category)
    .filter((store) => {
      if (!normalizedQuery) return true;
      const searchable = [store.name, store.nameEn, store.city].filter(Boolean).join(" ").toLocaleLowerCase(locale === "ar" ? "ar" : "en");
      return searchable.includes(normalizedQuery);
    }), [activeStores, category, normalizedQuery, locale]);

  const categories = productionMode ? liveCategories : demoCategories;
  const results = productionMode ? liveResults : demoResults;
  const total = productionMode ? liveTotal : demoResults.length;
  const hasMore = productionMode && liveResults.length < liveTotal;
  const hasFilters = Boolean(query || category !== "all");
  function resetFilters() { setQuery(""); setCategory("all"); }

  return <PublicShell locale={locale}>
    <section className="page-hero compact"><div className="container"><span className="eyebrow">TIJVORYA STORES</span><h1>{locale === "ar" ? "دليل المتاجر" : "Store directory"}</h1><p>{locale === "ar" ? "تصفح المتاجر الرسمية التي أطلقها التجار على المنصة، كل واحد بهويته البصرية ودومينه الخاص." : "Browse the official stores merchants have launched on the platform, each with its own brand identity and domain."}</p></div></section>
    <section className="section container">
      <div className="market-toolbar">
        <label className="search-field"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={locale === "ar" ? "ابحث عن متجر أو مدينة" : "Search stores or cities"} aria-label={locale === "ar" ? "البحث في المتاجر" : "Search stores"} /></label>
      </div>
      <div className="category-tabs" role="list" aria-label={locale === "ar" ? "تصنيفات المتاجر" : "Store categories"}>
        <button type="button" className={category === "all" ? "is-active" : ""} onClick={() => setCategory("all")} aria-pressed={category === "all"}>{locale === "ar" ? "الكل" : "All"}</button>
        {categories.map((item) => <button type="button" key={item} className={category === item ? "is-active" : ""} onClick={() => setCategory(item)} aria-pressed={category === item}>{businessCategoryLabel(item, locale)}</button>)}
      </div>
      <div className="results-line"><span><strong>{total}</strong> {locale === "ar" ? "متجر" : "stores"}</span>{hasFilters && <button type="button" onClick={resetFilters}><X /> {locale === "ar" ? "مسح الفلاتر" : "Clear filters"}</button>}</div>
      {results.length ? <>
        <div className="store-grid store-grid-logo-showcase">{results.map((store) => <StoreCard key={store.id} store={store} locale={locale} />)}</div>
        {hasMore && <button type="button" className="button button-ghost button-block" disabled={loadingMore} onClick={loadMore}>{loadingMore ? (locale === "ar" ? "جارٍ التحميل..." : "Loading...") : (locale === "ar" ? "تحميل المزيد" : "Load more")}</button>}
      </> : <EmptyState title={locale === "ar" ? "لا توجد متاجر مطابقة" : "No matching stores"} text={locale === "ar" ? "جرّب كلمات أو تصنيفًا مختلفًا." : "Try a different query or category."} />}
    </section>
  </PublicShell>;
}
