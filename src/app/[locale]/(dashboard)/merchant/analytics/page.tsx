"use client";

import { useEffect, useMemo, useState } from "react";
import { Film, Heart, MessageCircle, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ReelViewsChart } from "@/components/dashboard/reel-views-chart";
import { StatCard } from "@/components/dashboard/stat-card";
import { PersistentVideo } from "@/components/ui/persistent-media";
import { useApp } from "@/providers/app-provider";
import { loadReelViewEvents } from "@/lib/supabase/repository";

export default function Page() {
  const { locale, reels, stores, currentUser, productionMode } = useApp();
  const store = stores.find((item) => item.ownerId === currentUser?.id);
  const storeReels = useMemo(() => reels.filter((item) => item.storeId === store?.id), [reels, store?.id]);
  const [viewTimestamps, setViewTimestamps] = useState<string[]>([]);

  // reel_events isn't part of the shared workspace load (it's only ever
  // needed here, for the chart) - fetched on demand, same as reel comments
  // in the reel feed.
  useEffect(() => {
    if (!productionMode || storeReels.length === 0) return;
    let active = true;
    loadReelViewEvents(storeReels.map((reel) => reel.id))
      .then((timestamps) => { if (active) setViewTimestamps(timestamps); })
      .catch(console.error);
    return () => { active = false; };
  }, [productionMode, storeReels]);

  const views = storeReels.reduce((sum, reel) => sum + reel.views, 0);
  const likes = storeReels.reduce((sum, reel) => sum + reel.likes, 0);
  const comments = storeReels.reduce((sum, reel) => sum + (reel.commentsCount ?? 0), 0);
  const clicks = storeReels.reduce((sum, reel) => sum + (reel.productClicks ?? 0), 0);
  const attributedOrders = storeReels.reduce((sum, reel) => sum + (reel.ordersAttributed ?? 0), 0);
  const conversion = clicks > 0 ? `${((attributedOrders / clicks) * 100).toFixed(2)}%` : "—";

  return <>
    <PageHeader eyebrow="REEL ANALYTICS" title={locale === "ar" ? "تحليلات الريلز" : "Reel analytics"} text={locale === "ar" ? "كل رقم هنا محسوب من نشاط ريلزاتك الفعلي، بدون أرقام افتراضية." : "Every figure here is calculated from your actual reel activity, with no placeholder metrics."} />
    <div className="stats-grid">
      <StatCard label={locale === "ar" ? "إجمالي المشاهدات" : "Total views"} value={views.toLocaleString(locale === "ar" ? "ar-PS" : "en-US")} note={locale === "ar" ? `${storeReels.length} ريلز` : `${storeReels.length} reels`} icon={Film} trend="neutral" />
      <StatCard label={locale === "ar" ? "إجمالي الإعجابات" : "Total likes"} value={likes.toLocaleString(locale === "ar" ? "ar-PS" : "en-US")} note={locale === "ar" ? "عبر كل الريلزات" : "Across all reels"} icon={Heart} trend="neutral" />
      <StatCard label={locale === "ar" ? "إجمالي التعليقات" : "Total comments"} value={comments.toLocaleString(locale === "ar" ? "ar-PS" : "en-US")} note={locale === "ar" ? "عبر كل الريلزات" : "Across all reels"} icon={MessageCircle} trend="neutral" />
      <StatCard label={locale === "ar" ? "تحويل نقرات الريلز" : "Reel click conversion"} value={conversion} note={clicks > 0 ? (locale === "ar" ? `${attributedOrders} طلب من ${clicks} نقرة` : `${attributedOrders} orders from ${clicks} clicks`) : (locale === "ar" ? "لا توجد بيانات كافية بعد" : "Not enough data yet")} icon={TrendingUp} trend="neutral" />
    </div>
    <div className="dashboard-grid-main">
      <ReelViewsChart locale={locale} viewTimestamps={viewTimestamps} />
      <article className="editor-card">
        <div className="card-head"><div><span className="eyebrow">TOP REELS</span><h3>{locale === "ar" ? "أفضل الريلز حسب المشاهدات الفعلية" : "Top reels by actual views"}</h3></div></div>
        {[...storeReels].sort((a, b) => b.views - a.views).slice(0, 5).map((reel, index) => <div className="rank-row rank-row-video" key={reel.id}>
          <span>{index + 1}</span>
          <div className="rank-row-thumb"><PersistentVideo src={reel.videoUrl} poster={reel.cover} controls muted playsInline preload="metadata" /></div>
          <div><small>{reel.views.toLocaleString(locale === "ar" ? "ar-PS" : "en-US")} {locale === "ar" ? "مشاهدة" : "views"} · {reel.likes.toLocaleString(locale === "ar" ? "ar-PS" : "en-US")} {locale === "ar" ? "إعجاب" : "likes"} · {(reel.commentsCount ?? 0).toLocaleString(locale === "ar" ? "ar-PS" : "en-US")} {locale === "ar" ? "تعليق" : "comments"}</small></div>
        </div>)}
        {storeReels.length === 0 && <div className="inline-warning">{locale === "ar" ? "لا توجد بيانات ريلز حتى الآن." : "No reel data yet."}</div>}
      </article>
    </div>
  </>;
}
