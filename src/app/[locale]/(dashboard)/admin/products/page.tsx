"use client";

import { ArchiveRestore, ArchiveX } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusPill } from "@/components/ui/status-pill";
import { PersistentImage } from "@/components/ui/persistent-media";
import { useApp } from "@/providers/app-provider";

export default function Page() {
  const { locale, products, stores, saveProduct } = useApp();
  return <><PageHeader eyebrow="CATALOG GOVERNANCE" title={locale === "ar" ? "إدارة المنتجات" : "Product management"} text={locale === "ar" ? "مراجعة كتالوج المنصة وأرشفة المنتجات المخالفة أو إعادتها للنشر." : "Review the platform catalog and archive or restore products."} /><article className="editor-card"><div className="table-wrap"><table><thead><tr><th>{locale === "ar" ? "المنتج" : "Product"}</th><th>{locale === "ar" ? "المتجر" : "Store"}</th><th>{locale === "ar" ? "السعر" : "Price"}</th><th>{locale === "ar" ? "المخزون" : "Stock"}</th><th>{locale === "ar" ? "الحالة" : "Status"}</th><th>{locale === "ar" ? "إجراء" : "Action"}</th></tr></thead><tbody>{products.map((product) => { const store = stores.find((item) => item.id === product.storeId); return <tr key={product.id}><td><div className="table-product"><PersistentImage className="table-media" src={product.image} alt="" optimized width={44} height={44} /><strong>{locale === "ar" ? product.name : product.nameEn}</strong></div></td><td>{store ? (locale === "ar" ? store.name : store.nameEn) : product.storeId}</td><td>{product.price}</td><td>{product.stock}</td><td><StatusPill status={product.status} locale={locale} /></td><td><button className="icon-button" onClick={() => saveProduct({ ...product, status: product.status === "archived" ? "active" : "archived" })}>{product.status === "archived" ? <ArchiveRestore /> : <ArchiveX />}</button></td></tr>; })}</tbody></table></div></article></>;
}
