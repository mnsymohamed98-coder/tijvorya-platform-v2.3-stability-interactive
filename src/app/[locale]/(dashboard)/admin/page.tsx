"use client";

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  CheckCircle2,
  CircleDollarSign,
  Database,
  Film,
  Gauge,
  ImageUp,
  MessageCircle,
  ShieldAlert,
  ShieldCheck,
  Store,
  Users,
  WalletCards,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/providers/app-provider";
import { canAccessAdminSection, type AdminSection } from "@/lib/admin-permissions";
import type { AIStatusResponse } from "@/types/ai";

const orderLabels = {
  pending: { ar: "جديدة", en: "Pending" },
  accepted: { ar: "مقبولة", en: "Accepted" },
  preparing: { ar: "قيد التجهيز", en: "Preparing" },
  ready: { ar: "جاهزة", en: "Ready" },
  out_for_delivery: { ar: "قيد التوصيل", en: "Delivery" },
  completed: { ar: "مكتملة", en: "Completed" },
  cancelled: { ar: "ملغاة", en: "Cancelled" },
} as const;

export default function Page() {
  const { locale, currentUser, users, stores, products, reels, orders, conversations, auditLog, platformSettings, productionMode } = useApp();
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);
  const [aiStatus, setAiStatus] = useState<AIStatusResponse | null>(null);
  const adminRole = currentUser?.adminRole;
  const money = useMemo(() => new Intl.NumberFormat(locale === "ar" ? "ar-PS" : "en-US", { maximumFractionDigits: 0 }), [locale]);

  useEffect(() => {
    fetch("/api/health", { cache: "no-store" }).then((response) => setApiHealthy(response.ok)).catch(() => setApiHealthy(false));
    fetch("/api/ai/status", { cache: "no-store" }).then((response) => response.json()).then(setAiStatus).catch(() => setAiStatus(null));
  }, []);

  const metrics = useMemo(() => {
    const pendingReels = reels.filter((reel) => reel.status === "pending").length;
    const activeStores = stores.filter((store) => (store.status ?? "active") === "active").length;
    const openSupport = conversations.filter((conversation) => conversation.status === "open").length;
    const lowStock = products.filter((product) => product.status === "active" && product.stock <= 10).length;
    const nonCancelledOrders = orders.filter((order) => order.status !== "cancelled");
    const grossSales = nonCancelledOrders.reduce((sum, order) => sum + order.total, 0);
    const completedSales = orders.filter((order) => order.status === "completed").reduce((sum, order) => sum + order.total, 0);
    const platformRevenue = completedSales * (platformSettings.commissionPercent / 100);
    const activeUsers = users.filter((user) => user.status !== "suspended").length;
    return { pendingReels, activeStores, openSupport, lowStock, grossSales, completedSales, platformRevenue, activeUsers };
  }, [reels, stores, conversations, products, orders, platformSettings.commissionPercent, users]);

  const orderDistribution = useMemo(() => {
    const values = Object.keys(orderLabels).map((status) => ({ status: status as keyof typeof orderLabels, count: orders.filter((order) => order.status === status).length }));
    const max = Math.max(1, ...values.map((item) => item.count));
    return values.map((item) => ({ ...item, width: `${Math.max(item.count ? 9 : 0, (item.count / max) * 100)}%` }));
  }, [orders]);

  const storeRanking = useMemo(() => stores.map((store) => {
    const storeOrders = orders.filter((order) => order.storeId === store.id && order.status !== "cancelled");
    return { store, orders: storeOrders.length, revenue: storeOrders.reduce((sum, order) => sum + order.total, 0) };
  }).sort((a, b) => b.revenue - a.revenue).slice(0, 5), [stores, orders]);

  const risks = [
    { key: "reels", count: metrics.pendingReels, labelAr: "محتوى ينتظر المراجعة", labelEn: "Content awaiting review", detailAr: "يحتاج قرار نشر أو رفض", detailEn: "Requires publish or reject decision", danger: metrics.pendingReels > 5 },
    { key: "support", count: metrics.openSupport, labelAr: "محادثات دعم مفتوحة", labelEn: "Open support conversations", detailAr: "تحتاج متابعة تشغيلية", detailEn: "Require operational follow-up", danger: metrics.openSupport > 8 },
    { key: "stock", count: metrics.lowStock, labelAr: "منتجات منخفضة المخزون", labelEn: "Low-stock products", detailAr: "قد تؤثر في تنفيذ الطلبات", detailEn: "May affect order fulfillment", danger: metrics.lowStock > 10 },
    { key: "suspended", count: stores.filter((store) => store.status === "suspended").length + users.filter((user) => user.status === "suspended").length, labelAr: "حسابات أو متاجر معلقة", labelEn: "Suspended accounts or stores", detailAr: "تتطلب مراجعة دورية", detailEn: "Require periodic review", danger: false },
  ];

  const allQuickLinks: Array<{ section: AdminSection; href: string; ar: string; en: string; value: string | number; icon: typeof Film }> = [
    { section: "reels", href: "reels", ar: "مراجعة المحتوى", en: "Review content", value: metrics.pendingReels, icon: Film },
    { section: "stores", href: "stores", ar: "شبكة المتاجر", en: "Store network", value: stores.length, icon: Store },
    { section: "orders", href: "orders", ar: "الطلبات والمدفوعات", en: "Orders & payments", value: orders.length, icon: WalletCards },
    { section: "messages", href: "messages", ar: "الدعم والرسائل", en: "Support & messages", value: metrics.openSupport, icon: MessageCircle },
    { section: "audit", href: "audit", ar: "سجل النشاط", en: "Activity log", value: auditLog.length, icon: Activity },
  ];
  const quickLinks = allQuickLinks.filter((item) => canAccessAdminSection(adminRole, item.section));

  return <>
    <section className="admin-executive-hero">
      <div>
        <p className="admin-overline">EXECUTIVE OPERATIONS</p>
        <h2>{locale === "ar" ? "مركز القيادة والتشغيل" : "Command and operations center"}</h2>
        <p>{locale === "ar" ? "صورة موحدة لأداء المنصة، المخاطر العاجلة، الخدمات، والمهمات التي تحتاج قرارًا إداريًا." : "A unified view of platform performance, urgent risks, service health and decisions requiring administrative action."}</p>
      </div>
      <div className="admin-executive-state"><CheckCircle2 /><div><strong>{platformSettings.maintenanceMode ? (locale === "ar" ? "وضع الصيانة فعّال" : "Maintenance mode active") : (locale === "ar" ? "المنصة تعمل بصورة طبيعية" : "Platform operating normally")}</strong><span>{apiHealthy === null ? (locale === "ar" ? "جارٍ فحص الخدمات" : "Checking services") : apiHealthy ? (locale === "ar" ? "واجهة النظام تستجيب" : "System API responding") : (locale === "ar" ? "توجد مشكلة في الاستجابة" : "API response issue detected")}</span></div></div>
    </section>

    <div className="admin-kpi-grid">
      <article className="admin-kpi"><span>{locale === "ar" ? "إجمالي قيمة الطلبات" : "Gross order value"}<CircleDollarSign /></span><strong>{money.format(metrics.grossSales)} ₪</strong><small className="positive">{orders.filter((order) => order.status !== "cancelled").length} {locale === "ar" ? "طلبًا صالحًا" : "valid orders"}</small></article>
      <article className="admin-kpi"><span>{locale === "ar" ? "إيراد المنصة" : "Platform revenue"}<WalletCards /></span><strong>{money.format(metrics.platformRevenue)} ₪</strong><small>{platformSettings.commissionPercent}% {locale === "ar" ? "من المكتمل" : "of completed sales"}</small></article>
      <article className="admin-kpi"><span>{locale === "ar" ? "المتاجر النشطة" : "Active stores"}<Store /></span><strong>{metrics.activeStores}</strong><small className="positive">{stores.filter((store) => store.verified).length} {locale === "ar" ? "موثقة" : "verified"}</small></article>
      <article className="admin-kpi"><span>{locale === "ar" ? "المستخدمون النشطون" : "Active users"}<Users /></span><strong>{metrics.activeUsers}</strong><small>{users.filter((user) => user.role === "admin").length} {locale === "ar" ? "حسابات تشغيل" : "operations accounts"}</small></article>
      <article className="admin-kpi"><span>{locale === "ar" ? "قائمة المراجعة" : "Moderation queue"}<Film /></span><strong>{metrics.pendingReels}</strong><small className={metrics.pendingReels ? "warning" : "positive"}>{metrics.pendingReels ? (locale === "ar" ? "تحتاج قرارًا" : "Needs action") : (locale === "ar" ? "القائمة خالية" : "Queue clear")}</small></article>
      <article className="admin-kpi"><span>{locale === "ar" ? "طلبات الدعم" : "Support cases"}<MessageCircle /></span><strong>{metrics.openSupport}</strong><small className={metrics.openSupport ? "warning" : "positive"}>{locale === "ar" ? "محادثات مفتوحة" : "open conversations"}</small></article>
    </div>

    <div className="admin-overview-grid">
      <section className="admin-panel">
        <div className="admin-panel-head"><div><p className="admin-overline">SERVICE HEALTH</p><h3>{locale === "ar" ? "حالة خدمات المنصة" : "Platform service health"}</h3></div><Gauge /></div>
        <div className="admin-service-list">
          <div className="admin-service"><span><Database /></span><div><strong>Supabase</strong><small>{locale === "ar" ? "البيانات والمصادقة" : "Data and authentication"}</small></div><b className={productionMode ? "" : "demo"}>{productionMode ? "LIVE" : "LOCAL"}</b></div>
          <div className="admin-service"><span><Bot /></span><div><strong>OpenAI</strong><small>{aiStatus?.model ?? (locale === "ar" ? "حالة الاتصال" : "Connection status")}</small></div><b className={aiStatus?.mode === "live" ? "" : aiStatus?.mode === "demo" ? "demo" : "offline"}>{aiStatus?.mode?.toUpperCase() ?? "CHECK"}</b></div>
          <div className="admin-service"><span><ImageUp /></span><div><strong>{locale === "ar" ? "خدمة الوسائط" : "Media service"}</strong><small>{productionMode ? (locale === "ar" ? "رفع موقّع ومحمي" : "Signed secure uploads") : (locale === "ar" ? "تخزين تطوير محلي" : "Local development storage")}</small></div><b className={productionMode ? "" : "demo"}>{productionMode ? "READY" : "LOCAL"}</b></div>
          <div className="admin-service"><span><MessageCircle /></span><div><strong>{locale === "ar" ? "الرسائل" : "Messaging"}</strong><small>{locale === "ar" ? "تواصل العملاء والمتاجر" : "Customer-store communication"}</small></div><b className={platformSettings.messagingEnabled ? "" : "offline"}>{platformSettings.messagingEnabled ? "ON" : "OFF"}</b></div>
          <div className="admin-service"><span><ShieldCheck /></span><div><strong>{locale === "ar" ? "مراجعة الريلز" : "Reel moderation"}</strong><small>{locale === "ar" ? "بوابة النشر البشري" : "Human publishing gate"}</small></div><b className={platformSettings.reelModerationRequired ? "" : "demo"}>{platformSettings.reelModerationRequired ? "ON" : "OPEN"}</b></div>
          <div className="admin-service"><span><Gauge /></span><div><strong>API</strong><small>{locale === "ar" ? "واجهة النظام الداخلية" : "Internal system interface"}</small></div><b className={apiHealthy === false ? "offline" : apiHealthy === null ? "demo" : ""}>{apiHealthy === null ? "CHECK" : apiHealthy ? "OK" : "DOWN"}</b></div>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head"><div><p className="admin-overline">RISK WATCH</p><h3>{locale === "ar" ? "التنبيهات التشغيلية" : "Operational alerts"}</h3></div><ShieldAlert /></div>
        <div className="admin-risk-list">{risks.map((risk) => <div key={risk.key} className={`admin-risk-item ${risk.danger ? "danger" : risk.count === 0 ? "good" : ""}`}><span>{risk.count === 0 ? <CheckCircle2 /> : risk.danger ? <ShieldAlert /> : <AlertTriangle />}</span><div><strong>{locale === "ar" ? risk.labelAr : risk.labelEn}</strong><small>{locale === "ar" ? risk.detailAr : risk.detailEn}</small></div><b>{risk.count}</b></div>)}</div>
      </section>
    </div>

    <div className="admin-performance-grid">
      <section className="admin-panel">
        <div className="admin-panel-head"><div><p className="admin-overline">ORDER PIPELINE</p><h3>{locale === "ar" ? "توزيع حالات الطلبات" : "Order status distribution"}</h3></div><BarChart3 /></div>
        <div className="admin-bars">{orderDistribution.map((item) => <div className="admin-bar-row" key={item.status}><span>{orderLabels[item.status][locale]}</span><div className="admin-bar-track"><i style={{ width: item.width }} /></div><strong>{item.count}</strong></div>)}</div>
      </section>
      <section className="admin-panel">
        <div className="admin-panel-head"><div><p className="admin-overline">STORE PERFORMANCE</p><h3>{locale === "ar" ? "أعلى المتاجر بالقيمة" : "Top stores by value"}</h3></div><Store /></div>
        <div className="admin-store-ranking">{storeRanking.map((item, index) => <div key={item.store.id}><b>{index + 1}</b><span><strong>{locale === "ar" ? item.store.name : item.store.nameEn}</strong><small>{item.orders} {locale === "ar" ? "طلبات" : "orders"}</small></span><strong>{money.format(item.revenue)} ₪</strong></div>)}</div>
      </section>
    </div>

    <div className="admin-overview-grid">
      <section className="admin-panel">
        <div className="admin-panel-head"><div><p className="admin-overline">MODERATION PRIORITY</p><h3>{locale === "ar" ? "المحتوى ذو الأولوية" : "Priority content queue"}</h3></div>{canAccessAdminSection(adminRole, "reels") && <Link href={`/${locale}/admin/reels`}>{locale === "ar" ? "فتح قائمة المراجعة" : "Open moderation queue"}</Link>}</div>
        <div className="table-wrap"><table><thead><tr><th>ID</th><th>{locale === "ar" ? "الوصف" : "Caption"}</th><th>{locale === "ar" ? "المتجر" : "Store"}</th><th>{locale === "ar" ? "المشاهدات" : "Views"}</th></tr></thead><tbody>{reels.filter((reel) => reel.status === "pending").slice(0, 5).map((reel) => { const store = stores.find((item) => item.id === reel.storeId); return <tr key={reel.id}><td>{reel.id}</td><td>{locale === "ar" ? reel.caption : reel.captionEn}</td><td>{store ? (locale === "ar" ? store.name : store.nameEn) : reel.storeId}</td><td>{money.format(reel.views)}</td></tr>; })}{metrics.pendingReels === 0 && <tr><td colSpan={4}>{locale === "ar" ? "لا يوجد محتوى ينتظر المراجعة." : "No content is waiting for review."}</td></tr>}</tbody></table></div>
      </section>
      <section className="admin-panel">
        <div className="admin-panel-head"><div><p className="admin-overline">RECENT ACTIVITY</p><h3>{locale === "ar" ? "آخر الإجراءات" : "Recent actions"}</h3></div>{canAccessAdminSection(adminRole, "audit") && <Link href={`/${locale}/admin/audit`}>{locale === "ar" ? "السجل الكامل" : "Full log"}</Link>}</div>
        <div className="audit-list">{auditLog.slice(0, 7).map((entry) => <div key={entry.id}><span className="audit-dot" /><div><strong>{entry.details}</strong><small>{new Date(entry.createdAt).toLocaleString(locale === "ar" ? "ar-PS" : "en-US")}</small></div></div>)}</div>
      </section>
    </div>

    <section className="admin-action-grid">{quickLinks.map(({ href, ar, en, value, icon: Icon }) => <Link key={href} href={`/${locale}/admin/${href}`}><Icon /><strong>{locale === "ar" ? ar : en}</strong><span>{value}</span></Link>)}</section>
  </>;
}
