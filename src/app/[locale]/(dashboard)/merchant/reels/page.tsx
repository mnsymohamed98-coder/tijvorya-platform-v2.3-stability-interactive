"use client";

import Link from "next/link";
import { AlertTriangle, Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { PersistentImage } from "@/components/ui/persistent-media";
import { StatusPill } from "@/components/ui/status-pill";
import { useApp } from "@/providers/app-provider";

export default function Page() {
  const { locale, reels, products, stores, currentUser } = useApp();
  const store = stores.find((item) => item.ownerId === currentUser?.id);
  const items = reels.filter((reel) => reel.storeId === store?.id).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return <><PageHeader eyebrow="SHORT VIDEO" title={locale === "ar" ? "الريلز" : "Reels"} text={locale === "ar" ? "تابع حالة المسودة والمراجعة والاعتماد، واقرأ ملاحظات الإدارة عند الرفض." : "Track drafts, moderation, approval and admin feedback."} actions={<Link className="button button-dark" href={`/${locale}/merchant/reels/new`}><Plus />{locale === "ar" ? "رفع ريلز" : "Upload reel"}</Link>} />
    <div className="merchant-reels-grid">{items.map((reel) => { const product = products.find((item) => item.id === reel.productId); return <article key={reel.id} className="merchant-reel-card"><div className="merchant-reel-cover"><PersistentImage src={reel.cover} alt="" optimized sizes="(max-width: 850px) 50vw, 33vw" /></div><div><div className="merchant-reel-status-row"><StatusPill status={reel.status} locale={locale} /><small>{new Date(reel.createdAt).toLocaleDateString(locale === "ar" ? "ar-PS" : "en-US")}</small></div><h3>{product ? (locale === "ar" ? product.name : product.nameEn) : reel.productId}</h3><p>{locale === "ar" ? reel.caption : reel.captionEn}</p>{reel.status === "pending" && <div className="pending-feedback">{locale === "ar" ? "قيد المراجعة لدى إدارة المنصة. لن يظهر في الفيد العام قبل الاعتماد." : "Under admin review. It will not appear publicly before approval."}</div>}{reel.status === "rejected" && <div className="rejection-feedback"><AlertTriangle /><div><strong>{locale === "ar" ? "تم رفض الريلز" : "Reel rejected"}</strong><p>{reel.rejectionReason || (locale === "ar" ? "لم يتم إدخال سبب." : "No reason was provided.")}</p></div></div>}<div className="reel-card-stats"><span>{reel.views.toLocaleString()} views</span><span>{reel.likes.toLocaleString()} likes</span></div></div></article>; })}</div>
  </>;
}
