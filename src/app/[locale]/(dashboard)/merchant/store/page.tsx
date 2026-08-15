"use client";

import { StoreForm } from "@/components/forms/store-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { useApp } from "@/providers/app-provider";

export default function Page() {
  const { locale } = useApp();
  return <>
    <PageHeader
      eyebrow="STOREFRONT STUDIO"
      title={locale === "ar" ? "إعداد المتجر والثيم" : "Store and theme setup"}
      text={locale === "ar" ? "خصص هوية متجرك والغلاف والألوان والخطوط وتخطيط المنتجات، ثم عاين النتيجة قبل النشر." : "Customize your storefront identity, cover, colors, typography and product layout, then preview it before publishing."}
    />
    <StoreForm />
  </>;
}
