import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export function PublicShell({ children, locale, hideFooter }: { children: React.ReactNode; locale: "ar" | "en"; hideFooter?: boolean }) {
  return <>
    <a className="skip-link" href="#main-content">{locale === "ar" ? "انتقل إلى المحتوى" : "Skip to content"}</a>
    <SiteHeader />
    <main id="main-content">{children}</main>
    {!hideFooter && <SiteFooter locale={locale} />}
  </>;
}
