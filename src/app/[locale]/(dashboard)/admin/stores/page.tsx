"use client";

import { BadgeCheck, Ban, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusPill } from "@/components/ui/status-pill";
import { PersistentImage } from "@/components/ui/persistent-media";
import { useApp } from "@/providers/app-provider";

export default function Page() {
  const { locale, stores, setStoreStatus, setStoreVerified } = useApp();
  return <><PageHeader eyebrow="MERCHANT NETWORK" title={locale === "ar" ? "إدارة المتاجر" : "Store management"} text={locale === "ar" ? "تفعيل أو تعليق المتاجر، وإدارة شارة التوثيق من مركز الإدارة." : "Activate or suspend stores and manage verification from the admin center."} /><article className="editor-card"><div className="table-wrap"><table><thead><tr><th>{locale === "ar" ? "المتجر" : "Store"}</th><th>{locale === "ar" ? "المدينة" : "City"}</th><th>{locale === "ar" ? "التقييم" : "Rating"}</th><th>{locale === "ar" ? "الثقة" : "Trust"}</th><th>{locale === "ar" ? "الحالة" : "Status"}</th><th>{locale === "ar" ? "الإجراءات" : "Actions"}</th></tr></thead><tbody>{stores.map((store) => <tr key={store.id}><td><div className="table-product"><PersistentImage className="table-media" src={store.logo} alt="" /><div><strong>{locale === "ar" ? store.name : store.nameEn}</strong><small>/{store.slug}</small></div></div></td><td>{store.city}</td><td>{store.rating}</td><td>{store.verified ? (locale === "ar" ? "موثوق" : "Verified") : (locale === "ar" ? "غير موثق" : "Standard")}</td><td><StatusPill status={store.status ?? "active"} locale={locale} /></td><td><div className="table-actions admin-actions">{(store.status ?? "active") === "suspended" ? <button title={locale === "ar" ? "تفعيل" : "Activate"} onClick={() => setStoreStatus(store.id, "active")}><CheckCircle2 /></button> : <button title={locale === "ar" ? "تعليق" : "Suspend"} onClick={() => setStoreStatus(store.id, "suspended")}><Ban /></button>}<button className={store.verified ? "is-active" : ""} title={locale === "ar" ? "تبديل التوثيق" : "Toggle verification"} onClick={() => setStoreVerified(store.id, !store.verified)}><BadgeCheck /></button></div></td></tr>)}</tbody></table></div></article></>;
}
