"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Bot, Boxes, ChevronDown, CircleGauge, ClipboardList, Film, Globe2, LogOut, Menu, MessageCircle, Megaphone, PackagePlus, Settings, ShieldCheck, Store, Upload, Users, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/ui/logo";
import { PersistentImage } from "@/components/ui/persistent-media";
import { useApp } from "@/providers/app-provider";
import { signOut } from "@/lib/auth";
import { cn } from "@/lib/utils";

const merchantNav = [
  ["", "الرئيسية", "Overview", CircleGauge],
  ["/products", "المنتجات", "Products", Boxes],
  ["/orders", "الطلبات", "Orders", ClipboardList],
  ["/reels", "الريلز", "Reels", Film],
  ["/analytics", "التحليلات", "Analytics", BarChart3],
  ["/ai-studio", "استوديو AI", "AI Studio", Bot],
  ["/campaigns", "الحملات", "Campaigns", Megaphone],
  ["/messages", "الرسائل", "Messages", MessageCircle],
  ["/onboarding", "موقع المتجر", "Website builder", Globe2],
  ["/store", "إعدادات المتجر", "Store settings", Store],
  ["/settings", "الإعدادات", "Settings", Settings],
] as const;
const adminNav = [
  ["", "مركز التحكم", "Control center", ShieldCheck],
  ["/reels", "مراجعة الريلز", "Reel moderation", Film],
  ["/stores", "المتاجر", "Stores", Store],
  ["/products", "المنتجات", "Products", Boxes],
  ["/orders", "الطلبات", "Orders", ClipboardList],
  ["/users", "المستخدمون", "Users", Users],
  ["/messages", "مركز الرسائل", "Messaging center", MessageCircle],
  ["/reports", "التقارير", "Reports", BarChart3],
  ["/ai", "تحكم AI", "AI control", Bot],
  ["/settings", "إعدادات المنصة", "Platform settings", Settings],
] as const;

export function DashboardShell({ children, role }: { children: React.ReactNode; role: "merchant" | "admin" }) {
  const { locale, currentUser, cart, productionMode, conversations, stores, setCurrentUser } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const base = `/${locale}/${role}`;
  const nav = role === "merchant" ? merchantNav : adminNav;
  const ownedStoreIds = new Set(stores.filter((store) => store.ownerId === currentUser?.id).map((store) => store.id));
  const messageBadge = role === "merchant"
    ? conversations.filter((conversation) => ownedStoreIds.has(conversation.storeId)).reduce((sum, conversation) => sum + conversation.unreadByMerchant, 0)
    : conversations.filter((conversation) => conversation.status === "open").length;

  if (!currentUser || (currentUser.role !== role && !(role === "merchant" && currentUser.role === "influencer"))) {
    return <div className="auth-gate"><Logo locale={locale} /><div className="auth-gate-card"><ShieldCheck /><h1>{locale === "ar" ? "هذه المنطقة محمية" : "This area is protected"}</h1><p>{locale === "ar" ? "سجّل الدخول بالحساب المناسب للوصول إلى لوحة التحكم." : "Sign in with the appropriate account to access this dashboard."}</p><Link className="button button-dark" href={role === "admin" ? `/${locale}/admin-access` : `/${locale}/login?next=${encodeURIComponent(pathname)}`}>{locale === "ar" ? "تسجيل الدخول" : "Sign in"}</Link></div></div>;
  }

  async function logout() { await signOut(); setCurrentUser(null); router.push(`/${locale}`); }
  return <div className="dashboard-layout">
    <aside className={cn("dashboard-sidebar", mobileOpen && "is-open")}>
      <div className="sidebar-head"><Logo locale={locale} /><button className="icon-button mobile-only" onClick={() => setMobileOpen(false)}><X /></button></div>
      <nav className="dashboard-nav">{nav.map(([suffix, ar, en, Icon]) => {
        const href = `${base}${suffix}`;
        const active = suffix === "" ? pathname === base : pathname.startsWith(href);
        return <Link key={href} className={cn(active && "is-active")} href={href} onClick={() => setMobileOpen(false)}><Icon /><span>{locale === "ar" ? ar : en}</span>{suffix === "/messages" && messageBadge > 0 && <b className="nav-badge">{messageBadge > 99 ? "99+" : messageBadge}</b>}</Link>;
      })}</nav>
      {role === "merchant" && <div className="sidebar-quick"><small>{locale === "ar" ? "إنشاء سريع" : "Quick create"}</small><Link href={`${base}/products/new`}><PackagePlus />{locale === "ar" ? "منتج جديد" : "New product"}</Link><Link href={`${base}/reels/new`}><Upload />{locale === "ar" ? "رفع ريلز" : "Upload reel"}</Link><Link href={`${base}/messages`}><MessageCircle />{locale === "ar" ? "الرسائل" : "Messages"}</Link></div>}
      <div className="sidebar-plan"><span className={`mode-dot ${productionMode ? "production" : "demo"}`} /> <strong>{productionMode ? (locale === "ar" ? "وضع الإنتاج" : "Production mode") : (locale === "ar" ? "وضع محلي" : "Local mode")}</strong><p>{productionMode ? (locale === "ar" ? "البيانات متصلة بـ Supabase." : "Data is connected to Supabase.") : (locale === "ar" ? "البيانات محفوظة محليًا على هذا الجهاز." : "Data is stored locally on this device.")}</p></div>
    </aside>
    <div className="dashboard-main">
      <header className="dashboard-topbar"><button className="icon-button mobile-only" onClick={() => setMobileOpen(true)}><Menu /></button><div className="dashboard-search"><span>{locale === "ar" ? "بحث سريع في المنصة" : "Quick platform search"}</span></div><div className="dashboard-account"><Link className="icon-button" href={`/${locale}/cart`} aria-label="cart">{cart.length}</Link><span className="avatar">{currentUser.avatar && /^(https?:\/\/|\/|data:image\/)/i.test(currentUser.avatar) ? <PersistentImage className="media-cover" src={currentUser.avatar} alt={currentUser.fullName} optimized width={36} height={36} /> : (currentUser.avatar || currentUser.fullName.slice(0, 2).toUpperCase())}</span><span className="account-copy"><strong>{currentUser.fullName}</strong><small>{currentUser.role}</small></span><ChevronDown size={16} /><button className="icon-button" onClick={logout} aria-label="logout"><LogOut /></button></div></header>
      <main className="dashboard-content">{children}</main>
    </div>
  </div>;
}