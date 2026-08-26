import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export function SiteFooter({ locale }: { locale: "ar" | "en" }) {
  return <footer className="site-footer">
    <div className="container footer-grid">
      <div className="footer-brand-column"><Logo locale={locale} /><p>{locale === "ar" ? "منصة تجارة اجتماعية متعددة اللغات تجمع المتجر والريلز القابلة للشراء والطلبات في تجربة واحدة." : "A multilingual social-commerce platform unifying storefronts, shoppable reels and orders in one experience."}</p><span className="footer-trust"><ShieldCheck />{locale === "ar" ? "بنية صلاحيات ومراجعة محتوى للنسخة الإنتاجية" : "Production-ready permissions and content moderation foundation"}</span></div>
      <div><strong>{locale === "ar" ? "اكتشف" : "Discover"}</strong><Link href={`/${locale}/marketplace`}>{locale === "ar" ? "السوق" : "Marketplace"}</Link><Link href={`/${locale}/reels`}>{locale === "ar" ? "الريلز" : "Reels"}</Link><Link href={`/${locale}/pricing`}>{locale === "ar" ? "الباقات" : "Plans"}</Link></div>
      <div><strong>{locale === "ar" ? "الشركة" : "Company"}</strong><Link href={`/${locale}/about`}>{locale === "ar" ? "من نحن" : "About"}</Link><Link href={`/${locale}/contact`}>{locale === "ar" ? "تواصل معنا" : "Contact"}</Link><Link href={`/${locale}/register`}>{locale === "ar" ? "افتح متجرك" : "Open a store"}</Link></div>
      <div><strong>{locale === "ar" ? "الثقة" : "Trust"}</strong><Link href={`/${locale}/privacy`}>{locale === "ar" ? "الخصوصية" : "Privacy"}</Link><Link href={`/${locale}/terms`}>{locale === "ar" ? "الشروط" : "Terms"}</Link><Link href={`/${locale}/login`}>{locale === "ar" ? "تسجيل الدخول" : "Sign in"}</Link></div>
    </div>
    <div className="container footer-bottom"><span>© {new Date().getFullYear()} Tijvorya</span><span>{locale === "ar" ? "تجارة اجتماعية موثوقة، مصممة للنمو عبر الأسواق." : "Trusted social commerce, designed to grow across markets."}</span><span>{locale === "ar" ? "المؤسس والرئيس التنفيذي: Mohammed Mansy" : "Founder & CEO: Mohammed Mansy"}</span></div>
  </footer>;
}
