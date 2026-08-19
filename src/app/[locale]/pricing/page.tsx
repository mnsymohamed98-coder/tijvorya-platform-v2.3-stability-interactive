"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { useApp } from "@/providers/app-provider";

const plans = [
  {
    id: "free",
    price: "0",
    commission: "5%",
    ar: "مجاني",
    en: "Free",
    featuresAr: [
      "حتى 30 منتجًا",
      "متجر إلكتروني احترافي",
      "رفع حتى 5 ريلز",
      "إدارة الطلبات الأساسية",
      "الدفع عند الاستلام",
      "رابط مستقل لمتجرك",
    ],
    featuresEn: [
      "Up to 30 products",
      "Professional online store",
      "Up to 5 reels",
      "Basic order management",
      "Cash on delivery",
      "Dedicated store link",
    ],
  },
  {
    id: "basic",
    price: "15",
    commission: "3%",
    ar: "أساسي",
    en: "Basic",
    featuresAr: [
      "حتى 150 منتجًا",
      "حتى 30 ريلز",
      "تخصيص متقدم للمتجر",
      "تحليلات المبيعات والطلبات",
      "إدارة المخزون",
      "دعم بأولوية أعلى",
    ],
    featuresEn: [
      "Up to 150 products",
      "Up to 30 reels",
      "Advanced store customization",
      "Sales & order analytics",
      "Inventory management",
      "Priority support",
    ],
  },
  {
    id: "pro",
    price: "40",
    commission: "1.5%",
    ar: "برو",
    en: "Pro",
    featured: true,
    featuresAr: [
      "حتى 1,000 منتج",
      "حتى 150 ريلز",
      "تحليلات متقدمة للريلز والمبيعات",
      "حملات ترويجية داخل المنصة",
      "استيراد المنتجات عبر CSV",
      "أدوات ذكاء اصطناعي متقدمة",
      "شارة متجر احترافية",
    ],
    featuresEn: [
      "Up to 1,000 products",
      "Up to 150 reels",
      "Advanced reel & sales analytics",
      "Internal promotional campaigns",
      "CSV product import",
      "Advanced AI tools",
      "Professional store badge",
    ],
  },
  {
    id: "business",
    price: "100",
    commission: "0.5%",
    ar: "بزنس",
    en: "Business",
    featuresAr: [
      "منتجات غير محدودة",
      "ريلز غير محدودة",
      "حسابات متعددة لفريق المتجر",
      "تقارير وتحليلات متقدمة",
      "أدوات ذكاء اصطناعي كاملة",
      "أولوية في الظهور داخل المنصة",
      "دعم مخصص للأعمال",
    ],
    featuresEn: [
      "Unlimited products",
      "Unlimited reels",
      "Multiple store team accounts",
      "Advanced reports & analytics",
      "Full AI tools",
      "Priority platform visibility",
      "Dedicated business support",
    ],
  },
];

export default function PricingPage() {
  const { locale } = useApp();

  return (
    <PublicShell locale={locale}>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">PRICING</span>

          <h1>
            {locale === "ar"
              ? "اختر الباقة المناسبة لنمو متجرك"
              : "Choose the right plan to grow your store"}
          </h1>

          <p>
            {locale === "ar"
              ? "ابدأ مجانًا، وطوّر باقتك عندما يحتاج متجرك إلى أدوات وحدود أكبر."
              : "Start free and upgrade as your store needs more tools and higher limits."}
          </p>
        </div>
      </section>

      <section className="section container">
        <div className="pricing-grid">
          {plans.map((p) => (
            <article
              key={p.id}
              className={`pricing-card ${p.featured ? "featured" : ""}`}
            >
              {p.featured && (
                <span className="plan-badge">
                  {locale === "ar" ? "الأكثر اختيارًا" : "Most popular"}
                </span>
              )}

              <h2>{locale === "ar" ? p.ar : p.en}</h2>

              <div className="plan-price">
                <strong>${p.price}</strong>
                <span>/{locale === "ar" ? "شهر" : "month"}</span>
              </div>

              <p>
                {locale === "ar"
                  ? `عمولة ${p.commission} على الطلب المكتمل`
                  : `${p.commission} commission per completed order`}
              </p>

              <ul>
                {(locale === "ar" ? p.featuresAr : p.featuresEn).map(
                  (feature) => (
                    <li key={feature}>
                      <Check />
                      {feature}
                    </li>
                  )
                )}
              </ul>

              <Link
                className={`button button-block ${
                  p.featured ? "button-dark" : "button-ghost"
                }`}
                href={`/${locale}/register?plan=${p.id}`}
              >
                {p.id === "free"
                  ? locale === "ar"
                    ? "ابدأ مجانًا"
                    : "Start free"
                  : locale === "ar"
                    ? "اختر الباقة"
                    : "Choose plan"}
              </Link>
            </article>
          ))}
        </div>

        <div className="pricing-note">
          {locale === "ar"
            ? "يتم احتساب العمولة فقط على الطلبات المكتملة. قد تختلف خدمات الدفع الإلكتروني حسب الدولة ومزود الدفع."
            : "Commission is charged only on completed orders. Online payment availability may vary by country and payment provider."}
        </div>
      </section>
    </PublicShell>
  );
}