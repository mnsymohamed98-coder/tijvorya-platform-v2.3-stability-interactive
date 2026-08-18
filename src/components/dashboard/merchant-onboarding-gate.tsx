"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { normalizeStoreWebsiteProfile } from "@/lib/store-website";
import { useApp } from "@/providers/app-provider";

export function MerchantOnboardingGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    locale,
    currentUser,
    stores,
    ready,
    workspaceLoading,
  } = useApp();

  const pathname = usePathname();
  const router = useRouter();

  const onboardingPath = `/${locale}/merchant/onboarding`;

  const isMerchant = currentUser?.role === "merchant";

  const ownedStore = useMemo(() => {
    if (!currentUser?.id) return undefined;

    return stores.find(
      (store) => store.ownerId === currentUser.id
    );
  }, [stores, currentUser?.id]);

  const completed = useMemo(() => {
    if (!ownedStore) return false;

    return normalizeStoreWebsiteProfile(
      ownedStore.website
    ).onboardingCompleted;
  }, [ownedStore]);

  const mustOnboard =
    isMerchant &&
    ready &&
    !workspaceLoading &&
    !completed &&
    pathname !== onboardingPath;

  useEffect(() => {
    if (mustOnboard) {
      router.replace(onboardingPath);
    }
  }, [mustOnboard, onboardingPath, router]);

  /*
   * مهم:
   * لا نحجب محتوى لوحة التاجر بسبب workspaceLoading.
   * التحويل إلى onboarding يحدث فقط بعد اكتمال التحميل
   * والتأكد أن المتجر لم يكمل الإعداد.
   */
  return <>{children}</>;
}