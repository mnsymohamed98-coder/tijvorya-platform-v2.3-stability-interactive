"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";
import { useApp } from "@/providers/app-provider";

export function WorkspaceLoadBanner() {
  const { loadError, retryHydrate, locale } = useApp();
  if (!loadError) return null;
  return (
    <div className="workspace-load-banner" role="alert">
      <TriangleAlert />
      <span>
        {locale === "ar"
          ? "تعذّر تحميل بيانات المنصة بسبب مشكلة في الاتصال. قد لا تظهر بعض المتاجر أو المنتجات."
          : "Couldn't load platform data due to a connection issue. Some stores or products may not appear."}
      </span>
      <button type="button" onClick={retryHydrate}>
        <RefreshCw />
        {locale === "ar" ? "إعادة المحاولة" : "Retry"}
      </button>
    </div>
  );
}
