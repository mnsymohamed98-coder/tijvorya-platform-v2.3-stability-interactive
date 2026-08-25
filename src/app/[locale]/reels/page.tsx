"use client";

import Link from "next/link";
import { ReelFeed } from "@/components/reels/reel-feed";
import { useApp } from "@/providers/app-provider";

export default function ReelsPage() {
  const { locale, reels, stores } = useApp();
  const activeStoreIds = new Set(stores.filter((store) => (store.status ?? "active") === "active").map((store) => store.id));
  // No longer gated on "is this reel's product already in the cache" -
  // ReelFeed batch-resolves each reel's product/store lazily instead
  // (ReelItem itself renders nothing for a reel until both are available).
  const publicReels = reels.filter((reel) => reel.status === "approved" && activeStoreIds.has(reel.storeId));
  if (!publicReels.length) return <main className="reels-page reels-empty"><div className="empty-state"><h1>{locale === "ar" ? "لا توجد ريلز منشورة بعد" : "No published reels yet"}</h1><p>{locale === "ar" ? "تظهر هنا فقط الفيديوهات التي اعتمدتها الإدارة." : "Only admin-approved videos appear here."}</p><Link className="button button-light" href={`/${locale}`}>{locale === "ar" ? "العودة للرئيسية" : "Back home"}</Link></div></main>;
  return <main className="reels-page"><ReelFeed reels={publicReels} /></main>;
}
