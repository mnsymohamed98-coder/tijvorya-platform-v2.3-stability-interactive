import Link from "next/link";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { InstagramIcon, LinkedInIcon, TikTokIcon, XIcon } from "./social-icons";

const socialLinks = [
  { name: "Instagram", href: "#", icon: <InstagramIcon /> },
  { name: "TikTok", href: "#", icon: <TikTokIcon /> },
  { name: "X", href: "#", icon: <XIcon /> },
  { name: "LinkedIn", href: "#", icon: <LinkedInIcon /> },
] as const;

export function SiteFooter({ locale }: { locale: "ar" | "en" }) {
  return <footer className="site-footer">
    <span className="footer-glow" aria-hidden="true" />
    <div className="container footer-grid">
      <div className="footer-brand-column">
        <Link className="footer-brand" href={`/${locale}`} aria-label="Tijvorya">
          <Image src="/assets/tijvorya-mark-official.png" alt="" width={36} height={36} />
          <span>Tijvorya</span>
        </Link>
        <p>{locale === "ar" ? "منصة تجارة اجتماعية متعددة اللغات تجمع المتجر والريلز القابلة للشراء والطلبات في تجربة واحدة." : "A multilingual social-commerce platform unifying storefronts, shoppable reels and orders in one experience."}</p>
        <span className="footer-trust"><ShieldCheck />{locale === "ar" ? "بنية صلاحيات ومراجعة محتوى للنسخة الإنتاجية" : "Production-ready permissions and content moderation foundation"}</span>
        <div className="footer-social">{socialLinks.map((social) => <a key={social.name} href={social.href} aria-label={social.name} target="_blank" rel="noopener noreferrer">{social.icon}</a>)}</div>
      </div>
      <div><strong>{locale === "ar" ? "اكتشف" : "Discover"}</strong><Link href={`/${locale}/marketplace`}>{locale === "ar" ? "السوق" : "Marketplace"}</Link><Link href={`/${locale}/reels`}>{locale === "ar" ? "الريلز" : "Reels"}</Link><Link href={`/${locale}/pricing`}>{locale === "ar" ? "الباقات" : "Plans"}</Link></div>
      <div><strong>{locale === "ar" ? "الشركة" : "Company"}</strong><Link href={`/${locale}/about`}>{locale === "ar" ? "من نحن" : "About"}</Link><Link href={`/${locale}/contact`}>{locale === "ar" ? "تواصل معنا" : "Contact"}</Link><Link href={`/${locale}/register`}>{locale === "ar" ? "افتح متجرك" : "Open a store"}</Link></div>
      <div><strong>{locale === "ar" ? "الثقة" : "Trust"}</strong><Link href={`/${locale}/privacy`}>{locale === "ar" ? "الخصوصية" : "Privacy"}</Link><Link href={`/${locale}/terms`}>{locale === "ar" ? "الشروط" : "Terms"}</Link><Link href={`/${locale}/login`}>{locale === "ar" ? "تسجيل الدخول" : "Sign in"}</Link></div>
    </div>
    <div className="container footer-bottom"><span>© {new Date().getFullYear()} Tijvorya</span><span>{locale === "ar" ? "تجارة اجتماعية موثوقة، مصممة للنمو عبر الأسواق." : "Trusted social commerce, designed to grow across markets."}</span><span>{locale === "ar" ? "المؤسس والرئيس التنفيذي: Mohammed Mansi" : "Founder & CEO: Mohammed Mansi"}</span></div>
  </footer>;
}
