import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export function PublicShell({ children, locale }: { children: React.ReactNode; locale: "ar" | "en" }) {
  return <>
    <a className="skip-link" href="#main-content">{locale === "ar" ? "انتقل إلى المحتوى" : "Skip to content"}</a>
    <SiteHeader />
    <main id="main-content">{children}</main>
    <SiteFooter locale={locale} />
  </>;
}
