"use client";

import Link from "next/link";
import { Bell, Heart, Menu, MessageCircle, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { copy } from "@/lib/i18n";
import { useApp } from "@/providers/app-provider";
import { Logo } from "@/components/ui/logo";

export function SiteHeader() {
  const { locale, cart, favoriteIds, currentUser, conversations } = useApp();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const t = copy[locale];
  const dashboardHref = currentUser?.role === "admin" ? `/${locale}/admin` : currentUser?.role === "merchant" || currentUser?.role === "influencer" ? `/${locale}/merchant` : `/${locale}/account`;
  const messagesHref = currentUser?.role === "admin" ? `/${locale}/admin/messages` : currentUser?.role === "merchant" || currentUser?.role === "influencer" ? `/${locale}/merchant/messages` : `/${locale}/messages`;
  const unreadMessages = currentUser?.role === "admin"
    ? conversations.reduce((sum, conversation) => sum + conversation.unreadByMerchant + conversation.unreadByCustomer, 0)
    : currentUser?.role === "merchant" || currentUser?.role === "influencer"
      ? conversations.reduce((sum, conversation) => sum + conversation.unreadByMerchant, 0)
      : conversations.filter((conversation) => conversation.customerId === currentUser?.id).reduce((sum, conversation) => sum + conversation.unreadByCustomer, 0);
  const nextLocale = locale === "ar" ? "en" : "ar";
  const localeHref = pathname?.replace(/^\/(ar|en)(?=\/|$)/, `/${nextLocale}`) || `/${nextLocale}`;
  const isActive = (href: string) => href === `/${locale}` ? pathname === href : Boolean(pathname?.startsWith(href));
  const labels = locale === "ar"
    ? { menu: "فتح القائمة", search: "البحث", favorites: "المفضلة", messages: "الرسائل", cart: "سلة التسوق", language: "التبديل إلى الإنجليزية" }
    : { menu: "Open menu", search: "Search", favorites: "Favorites", messages: "Messages", cart: "Shopping cart", language: "Switch to Arabic" };

  const navItems = [
    [`/${locale}`, t.nav.home],
    [`/${locale}/marketplace`, t.nav.marketplace],
    [`/${locale}/reels`, t.nav.reels],
    [`/${locale}/pricing`, t.nav.pricing],
    [`/${locale}/about`, t.nav.about],
  ] as const;

  return <header className="site-header">
    <div className="container header-inner">
      <Logo locale={locale} />
      <button
        type="button"
        className="icon-button mobile-only"
        onClick={() => setOpen((value) => !value)}
        aria-label={labels.menu}
        aria-expanded={open}
        aria-controls="primary-navigation"
      >{open ? <X /> : <Menu />}</button>
      <nav id="primary-navigation" className={`main-nav ${open ? "is-open" : ""}`} aria-label={locale === "ar" ? "التنقل الرئيسي" : "Primary navigation"}>
        {navItems.map(([href, label]) => <Link key={href} className={isActive(href) ? "is-active" : undefined} href={href} onClick={() => setOpen(false)}>{label}</Link>)}
      </nav>
      <div className="header-actions">
        <Link className="icon-button desktop-only" href={`/${locale}/marketplace`} aria-label={labels.search}><Search /></Link>
        <Link className="icon-button desktop-only" href={`/${locale}/marketplace?favorites=1`} aria-label={`${labels.favorites}: ${favoriteIds.length}`}><Heart />{favoriteIds.length > 0 && <span className="badge-count">{favoriteIds.length}</span>}</Link>
        {currentUser && <Link className="icon-button" href={messagesHref} aria-label={`${labels.messages}: ${unreadMessages}`}><MessageCircle />{unreadMessages > 0 && <span className="badge-count">{unreadMessages}</span>}</Link>}
        <Link className="icon-button" href={`/${locale}/cart`} aria-label={`${labels.cart}: ${cart.reduce((sum, item) => sum + item.quantity, 0)}`}><ShoppingBag />{cart.length > 0 && <span className="badge-count">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>}</Link>
        {currentUser ? <Link className="button button-ghost desktop-only" href={dashboardHref}><Bell size={17} />{locale === "ar" ? "لوحتي" : "Dashboard"}</Link> : <Link className="button button-ghost desktop-only" href={`/${locale}/login`}><UserRound size={17} />{t.nav.login}</Link>}
        <Link className="locale-switch" href={localeHref} hrefLang={nextLocale} aria-label={labels.language}>{locale === "ar" ? "EN" : "ع"}</Link>
      </div>
    </div>
  </header>;
}
