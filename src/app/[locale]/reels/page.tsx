"use client";

import Link from "next/link";
import { ReelFeed } from "@/components/reels/reel-feed";
import { useApp } from "@/providers/app-provider";

export default function ReelsPage() {
  const { locale, reels, products, stores } = useApp();
  const activeStoreIds = new Set(stores.filter((store) => (store.status ?? "active") === "active").map((store) => store.id));
  const activeProductIds = new Set(products.filter((product) => product.status === "active" && activeStoreIds.has(product.storeId)).map((product) => product.id));
  const publicReels = reels.filter((reel) => reel.status === "approved" && activeStoreIds.has(reel.storeId) && activeProductIds.has(reel.productId));
  if (!publicReels.length) return <main className="reels-page reels-empty"><div className="empty-state"><h1>{locale === "ar" ? "لا توجد ريلز منشورة بعد" : "No published reels yet"}</h1><p>{locale === "ar" ? "تظهر هنا فقط الفيديوهات التي اعتمدتها الإدارة." : "Only admin-approved videos appear here."}</p><Link className="button button-light" href={`/${locale}`}>{locale === "ar" ? "العودة للرئيسية" : "Back home"}</Link></div></main>;
  return <main className="reels-page"><ReelFeed reels={publicReels} /></main>;
}
