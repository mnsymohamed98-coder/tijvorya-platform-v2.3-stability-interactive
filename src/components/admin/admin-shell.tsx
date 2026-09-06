"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  BellRing,
  Bot,
  Boxes,
  ChevronDown,
  ClipboardList,
  ExternalLink,
  Film,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Search,
  Settings,
  ShieldCheck,
  Store,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useApp } from "@/providers/app-provider";
import { Avatar } from "@/components/ui/avatar";
import { signOut } from "@/lib/auth";
import { adminRoleLabel, adminSectionFromPath, canAccessAdminSection, type AdminSection } from "@/lib/admin-permissions";
import { cn } from "@/lib/utils";

const nav = [
  ["", "overview", "نظرة تنفيذية", "Executive overview", LayoutDashboard],
  ["/reels", "reels", "مراجعة الريلز", "Reel moderation", Film],
  ["/stores", "stores", "المتاجر", "Stores", Store],
  ["/products", "products", "المنتجات", "Products", Boxes],
  ["/orders", "orders", "الطلبات والمدفوعات", "Orders & payments", ClipboardList],
  ["/users", "users", "المستخدمون والصلاحيات", "Users & permissions", Users],
  ["/messages", "messages", "الدعم والرسائل", "Support & messages", MessageCircle],
  ["/reports", "reports", "التقارير والتحليلات", "Reports & analytics", BarChart3],
  ["/ai", "ai", "حوكمة الذكاء الاصطناعي", "AI governance", Bot],
  ["/audit", "audit", "سجل النشاط", "Activity log", Activity],
  ["/settings", "settings", "إعدادات المنصة", "Platform settings", Settings],
] as const satisfies ReadonlyArray<readonly [string, AdminSection, string, string, typeof LayoutDashboard]>;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { locale, currentUser, productionMode, conversations, reels, setCurrentUser } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const base = `/${locale}/admin`;
  const adminRole = currentUser?.adminRole;
  const activeSection = adminSectionFromPath(pathname);
  const allowedNav = useMemo(() => nav.filter(([, section]) => canAccessAdminSection(adminRole, section)), [adminRole]);
  const openSupport = conversations.filter((conversation) => conversation.status === "open").length;
  const pendingReels = reels.filter((reel) => reel.status === "pending").length;
  const otherLocale = locale === "ar" ? "en" : "ar";
  const localePath = pathname.replace(/^\/(ar|en)(?=\/|$)/, `/${otherLocale}`);

  if (currentUser?.role === "admin" && !adminRole) {
    return <main className="admin-auth-gate"><div className="admin-auth-gate-card"><span className="admin-gate-mark"><ShieldCheck /></span><p className="admin-overline">ACCESS POLICY</p><h1>{locale === "ar" ? "لم تُعيّن صلاحية إدارية لهذا الحساب" : "No administrative role is assigned"}</h1><p>{locale === "ar" ? "يجب أن يعيّن المدير العام رتبة إدارية محددة قبل السماح بالوصول." : "A super administrator must assign a specific admin role before access is allowed."}</p><Link className="button admin-primary-button" href={`/${locale}/admin-access`}>{locale === "ar" ? "العودة إلى الدخول الإداري" : "Return to admin sign in"}</Link></div></main>;
  }

  if (!currentUser || currentUser.role !== "admin") {
    return <main className="admin-auth-gate">
      <div className="admin-auth-gate-card">
        <span className="admin-gate-mark"><ShieldCheck /></span>
        <p className="admin-overline">TIJVORYA CONTROL CENTER</p>
        <h1>{locale === "ar" ? "منطقة تشغيل محمية" : "Protected operations area"}</h1>
        <p>{locale === "ar" ? "يجب استخدام حساب إداري مصرح للوصول إلى مركز التحكم." : "Use an authorized administrative account to access the control center."}</p>
        <Link className="button admin-primary-button" href={`/${locale}/admin-access`}>{locale === "ar" ? "الدخول الإداري الخاص" : "Private admin sign in"}</Link>
      </div>
    </main>;
  }

  if (!canAccessAdminSection(adminRole, activeSection)) {
    return <main className="admin-auth-gate">
      <div className="admin-auth-gate-card">
        <span className="admin-gate-mark"><ShieldCheck /></span>
        <p className="admin-overline">ACCESS POLICY</p>
        <h1>{locale === "ar" ? "لا تملك صلاحية هذا القسم" : "This section is not assigned to your role"}</h1>
        <p>{locale === "ar" ? `صلاحيتك الحالية: ${adminRoleLabel(adminRole, locale)}.` : `Current access level: ${adminRoleLabel(adminRole, locale)}.`}</p>
        <Link className="button admin-primary-button" href={base}>{locale === "ar" ? "العودة إلى مركز التحكم" : "Return to control center"}</Link>
      </div>
    </main>;
  }

  async function logout() {
    await signOut();
    setCurrentUser(null);
    router.push(`/${locale}/admin-access`);
  }

  return <div className="admin-layout">
    <aside className={cn("admin-sidebar", mobileOpen && "is-open")}>
      <div className="admin-sidebar-brand">
        <Link href={base} aria-label="Tijvorya Control Center"><Image src="/assets/tijvorya-mark-official.png" alt="Tijvorya" width={42} height={42} priority /></Link>
        <div><strong>Tijvorya</strong><span>CONTROL CENTER</span></div>
        <button className="admin-mobile-close" type="button" onClick={() => setMobileOpen(false)} aria-label="close"><X /></button>
      </div>

      <div className="admin-identity-card">
        <Avatar className="admin-avatar" value={currentUser.avatar} fallback={currentUser.fullName.slice(0, 2)} />
        <div><strong>{currentUser.fullName}</strong><span>{adminRoleLabel(adminRole, locale)}</span></div>
        <ShieldCheck />
      </div>

      <nav className="admin-navigation" aria-label={locale === "ar" ? "أقسام مركز التحكم" : "Control center sections"}>
        {allowedNav.map(([suffix, section, ar, en, Icon]) => {
          const href = `${base}${suffix}`;
          const active = section === "overview" ? pathname === base : pathname.startsWith(href);
          const badge = section === "reels" ? pendingReels : section === "messages" ? openSupport : 0;
          return <Link key={href} className={cn(active && "is-active")} href={href} onClick={() => setMobileOpen(false)}>
            <Icon /><span>{locale === "ar" ? ar : en}</span>{badge > 0 && <b>{badge > 99 ? "99+" : badge}</b>}
          </Link>;
        })}
      </nav>

      <div className="admin-sidebar-status">
        <div><span className={cn("admin-status-dot", productionMode ? "is-live" : "is-demo")} /><strong>{productionMode ? (locale === "ar" ? "بيئة إنتاج" : "Production") : (locale === "ar" ? "بيئة تطوير محلية" : "Local development")}</strong></div>
        <p>{productionMode ? (locale === "ar" ? "Supabase متصل، وتُحفظ العمليات مركزيًا." : "Supabase is connected and operations are persisted centrally.") : (locale === "ar" ? "البيانات محلية وآمنة للاختبار والتطوير." : "Data is local for safe testing and development.")}</p>
      </div>
    </aside>

    {mobileOpen && <button className="admin-sidebar-backdrop" onClick={() => setMobileOpen(false)} aria-label="close navigation" />}

    <div className="admin-main">
      <header className="admin-topbar">
        <div className="admin-topbar-start">
          <button className="admin-menu-button" type="button" onClick={() => setMobileOpen(true)} aria-label="menu"><Menu /></button>
          <div className="admin-search"><Search /><span>{locale === "ar" ? "بحث تشغيلي سريع" : "Quick operational search"}</span><kbd>⌘ K</kbd></div>
        </div>
        <div className="admin-topbar-actions">
          <Link className="admin-language" href={localePath}>{otherLocale.toUpperCase()}</Link>
          <Link className="admin-topbar-icon" href={`/${locale}`} title={locale === "ar" ? "عرض الموقع العام" : "View public site"}><ExternalLink /></Link>
          <Link className="admin-topbar-icon" href={`${base}/audit`} title={locale === "ar" ? "التنبيهات والسجل" : "Alerts and activity"}><BellRing /><i>{pendingReels + openSupport}</i></Link>
          <div className="admin-account-menu"><Avatar className="admin-avatar small" value={currentUser.avatar} fallback={currentUser.fullName.slice(0, 2)} /><div><strong>{currentUser.fullName}</strong><span>{adminRoleLabel(adminRole, locale)}</span></div><ChevronDown /></div>
          <button className="admin-topbar-icon" type="button" onClick={logout} title={locale === "ar" ? "تسجيل الخروج" : "Sign out"}><LogOut /></button>
        </div>
      </header>
      <main className="admin-content">{children}</main>
    </div>
  </div>;
}
