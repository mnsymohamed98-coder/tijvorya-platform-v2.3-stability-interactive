"use client";

import { PageHeader } from "@/components/dashboard/page-header";
import { StoreOnboardingWizard } from "@/components/forms/store-onboarding-wizard";
import { useApp } from "@/providers/app-provider";

export default function Page() {
  const { locale } = useApp();
  return <>
    <PageHeader eyebrow="MERCHANT WEBSITE ONBOARDING" title={locale === "ar" ? "إنشاء موقع متجرك" : "Create your merchant website"} text={locale === "ar" ? "أدخل بيانات نشاطك مرة واحدة، وTijvorya ينظمها تلقائيًا داخل موقع احترافي من ثلاث صفحات." : "Enter your business details once and Tijvorya turns them into a professional three-page storefront."} />
    <StoreOnboardingWizard />
  </>;
}
