"use client";

import Link from "next/link";
import { Check, CircleCheck, Crown } from "lucide-react";
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
    id: "pro",
    price: "19",
    commission: "1%",
    ar: "احترافي",
    en: "Pro",
    featured: true,
    featuresAr: [
      "موقع إلكتروني خاص بمتجرك لعرض منتجاتك والتحكم الكامل بإدارته",
      "تخصيص متقدم لهوية المتجر",
      "منتجات غير محدودة",
      "ريلز غير محدودة",
      "إدارة المخزون",
      "دعم بأولوية أعلى",
      "تقارير وتحليلات متقدمة",
      "كل أدوات ومزايا المنصة مفتوحة بالكامل",
    ],
    featuresEn: [
      "Your own store website to showcase products, with full management control",
      "Advanced store customization",
      "Unlimited products",
      "Unlimited reels",
      "Inventory management",
      "Priority support",
      "Advanced reports & analytics",
      "Every platform feature fully unlocked",
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

          <p className="pricing-paid-plans-note">
            {locale === "ar"
              ? "التسجيل في الباقات المدفوعة موقوف مؤقتًا لحين استكمال بوابة الدفع الآمنة — الباقة المجانية متاحة بالكامل."
              : "Paid plan sign-ups are temporarily paused while we finalize secure payment integration — the Free plan remains fully available."}
          </p>
        </div>
      </section>

      <section className="section container">
        <div className="pricing-grid">
          {plans.map((p) => {
            const disabled = p.id !== "free";
            return (
            <article
              key={p.id}
              className={`pricing-card ${p.featured ? "featured" : ""} ${disabled ? "is-coming-soon" : ""}`}
            >
              {p.featured ? (
                <span className="plan-badge">
                  <Crown />
                  {disabled
                    ? locale === "ar" ? "الأفضل قيمة · قريبًا" : "Best value · Coming soon"
                    : locale === "ar" ? "الأكثر اختيارًا" : "Most popular"}
                </span>
              ) : (
                <span className="plan-badge is-live">
                  <CircleCheck />
                  {locale === "ar" ? "متاح الآن" : "Available now"}
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

              {disabled ? (
                <button type="button" className="button button-block button-ghost" disabled>
                  {locale === "ar" ? "قريبًا" : "Coming soon"}
                </button>
              ) : (
                <Link
                  className={`button button-block ${
                    p.featured ? "button-dark" : "button-ghost"
                  }`}
                  href={`/${locale}/register?plan=${p.id}`}
                >
                  {locale === "ar" ? "ابدأ مجانًا" : "Start free"}
                </Link>
              )}
            </article>
            );
          })}
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