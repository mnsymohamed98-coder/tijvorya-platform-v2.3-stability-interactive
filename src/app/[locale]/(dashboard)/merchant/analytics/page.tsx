"use client";

import { Film, PackageCheck, ShoppingBag, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { StatCard } from "@/components/dashboard/stat-card";
import { useApp } from "@/providers/app-provider";
import { formatMoney } from "@/lib/utils";

export default function Page() {
  const { locale, orders, reels, stores, currentUser } = useApp();
  const store = stores.find((item) => item.ownerId === currentUser?.id);
  const storeOrders = orders.filter((item) => item.storeId === store?.id);
  const storeReels = reels.filter((item) => item.storeId === store?.id);
  const completed = storeOrders.filter((item) => item.status === "completed");
  const revenue = completed.reduce((sum, order) => sum + order.total, 0);
  const views = storeReels.reduce((sum, reel) => sum + reel.views, 0);
  const clicks = storeReels.reduce((sum, reel) => sum + (reel.productClicks ?? 0), 0);
  const attributedOrders = storeReels.reduce((sum, reel) => sum + (reel.ordersAttributed ?? 0), 0);
  const conversion = clicks > 0 ? `${((attributedOrders / clicks) * 100).toFixed(2)}%` : "—";

  return <>
    <PageHeader eyebrow="ANALYTICS" title={locale === "ar" ? "التحليلات" : "Analytics"} text={locale === "ar" ? "كل رقم هنا محسوب من نشاط متجرك الفعلي، بدون أرقام افتراضية." : "Every figure here is calculated from your actual store activity, with no placeholder metrics."} />
    <div className="stats-grid">
      <StatCard label={locale === "ar" ? "إيراد مكتمل" : "Completed revenue"} value={formatMoney(revenue, locale)} note={locale === "ar" ? "طلبات مكتملة فقط" : "Completed orders only"} icon={ShoppingBag} trend="neutral" />
      <StatCard label={locale === "ar" ? "طلبات مكتملة" : "Completed orders"} value={String(completed.length)} note={locale === "ar" ? `من ${storeOrders.length} طلب` : `of ${storeOrders.length} orders`} icon={PackageCheck} trend="neutral" />
      <StatCard label={locale === "ar" ? "إجمالي المشاهدات" : "Total views"} value={views.toLocaleString(locale === "ar" ? "ar-PS" : "en-US")} note={locale === "ar" ? `${storeReels.length} ريلز` : `${storeReels.length} reels`} icon={Film} trend="neutral" />
      <StatCard label={locale === "ar" ? "تحويل نقرات الريلز" : "Reel click conversion"} value={conversion} note={clicks > 0 ? (locale === "ar" ? `${attributedOrders} طلب من ${clicks} نقرة` : `${attributedOrders} orders from ${clicks} clicks`) : (locale === "ar" ? "لا توجد بيانات كافية بعد" : "Not enough data yet")} icon={TrendingUp} trend="neutral" />
    </div>
    <div className="dashboard-grid-main"><SalesChart locale={locale} orders={storeOrders} /><article className="editor-card"><div className="card-head"><div><span className="eyebrow">TOP REELS</span><h3>{locale === "ar" ? "أفضل الريلز حسب المشاهدات الفعلية" : "Top reels by actual views"}</h3></div></div>{[...storeReels].sort((a, b) => b.views - a.views).slice(0, 5).map((reel, index) => <div className="rank-row" key={reel.id}><span>{index + 1}</span><div><strong>{locale === "ar" ? reel.caption : reel.captionEn}</strong><small>{reel.views.toLocaleString(locale === "ar" ? "ar-PS" : "en-US")} {locale === "ar" ? "مشاهدة" : "views"}</small></div></div>)}{storeReels.length === 0 && <div className="inline-warning">{locale === "ar" ? "لا توجد بيانات ريلز حتى الآن." : "No reel data yet."}</div>}</article></div>
  </>;
}
