"use client";

import { LoaderCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { normalizeStoreWebsiteProfile } from "@/lib/store-website";
import { useApp } from "@/providers/app-provider";

export function MerchantOnboardingGate({ children }: { children: React.ReactNode }) {
  const { locale, currentUser, stores, ready, workspaceLoading } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const onboardingPath = `/${locale}/merchant/onboarding`;
  const isMerchant = currentUser?.role === "merchant";
  const completed = useMemo(() => stores.some((store) => store.ownerId === currentUser?.id && normalizeStoreWebsiteProfile(store.website).onboardingCompleted), [stores, currentUser?.id]);
  const mustOnboard = Boolean(isMerchant && ready && !workspaceLoading && !completed && pathname !== onboardingPath);

  useEffect(() => {
    if (mustOnboard) router.replace(onboardingPath);
  }, [mustOnboard, onboardingPath, router]);

  if (isMerchant && (workspaceLoading || mustOnboard)) {
    return <div className="merchant-gate-loading"><LoaderCircle className="spin" /><div><strong>{locale === "ar" ? "نجهز مساحة متجرك" : "Preparing your store workspace"}</strong><span>{locale === "ar" ? "لحظات وسيتم فتح إعداد موقعك التجاري." : "Your merchant website setup will open in a moment."}</span></div></div>;
  }

  return <>{children}</>;
}
