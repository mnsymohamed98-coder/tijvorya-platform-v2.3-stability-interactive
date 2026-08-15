"use client";

import Link from "next/link";
import { Heart, MessageCircle, Minus, Plus, ShieldCheck, ShoppingBag, Star, Store as StoreIcon, Truck } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ProductCard } from "@/components/commerce/product-card";
import { PublicShell } from "@/components/layout/public-shell";
import { PersistentImage } from "@/components/ui/persistent-media";
import { useApp } from "@/providers/app-provider";
import { formatMoney } from "@/lib/utils";
import { merchantStoreHref } from "@/lib/store-website";

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const { locale, products, stores, addToCart, favoriteIds, toggleFavorite, platformSettings } = useApp();
  const product = products.find((item) => item.id === params.id && item.status === "active");
  const [qty, setQty] = useState(1);
  const [variant, setVariant] = useState("");

  if (!product) return <PublicShell locale={locale}><main className="centered-page"><div className="empty-state"><h1>{locale === "ar" ? "المنتج غير موجود" : "Product not found"}</h1><Link className="button button-dark" href={`/${locale}/marketplace`}>{locale === "ar" ? "العودة للسوق" : "Back to marketplace"}</Link></div></main></PublicShell>;
  const store = stores.find((item) => item.id === product.storeId && (item.status ?? "active") === "active");
  if (!store) return <PublicShell locale={locale}><main className="centered-page"><div className="empty-state"><h1>{locale === "ar" ? "المتجر غير متاح" : "Store unavailable"}</h1><Link className="button button-dark" href={`/${locale}/marketplace`}>{locale === "ar" ? "العودة للسوق" : "Back to marketplace"}</Link></div></main></PublicShell>;
  const related = products.filter((item) => item.storeId === product.storeId && item.id !== product.id && item.status === "active").slice(0, 4);
  const fav = favoriteIds.includes(product.id);

  return <PublicShell locale={locale}><section className="section container"><div className="product-detail"><div className="product-detail-media"><PersistentImage className="media-fill" src={product.image} alt={locale === "ar" ? product.name : product.nameEn} /></div><div className="product-detail-copy"><Link className="store-kicker large" href={merchantStoreHref(store.slug, locale)}><StoreIcon/>{locale === "ar" ? store.name : store.nameEn}{store.verified && <span className="verified-dot">✓</span>}</Link><h1>{locale === "ar" ? product.name : product.nameEn}</h1><div className="rating-row large">{product.rating > 0 && <><Star fill="currentColor"/>{product.rating.toFixed(1)}<span className="muted">·</span></>}<span className="muted">{product.stock} {locale === "ar" ? "قطعة متوفرة" : "in stock"}</span></div><div className="detail-price"><strong>{formatMoney(product.price, locale)}</strong>{product.compareAtPrice && <del>{formatMoney(product.compareAtPrice, locale)}</del>}</div><p className="detail-description">{locale === "ar" ? product.description : product.descriptionEn}</p>{product.variants?.length ? <div className="variant-block"><strong>{locale === "ar" ? "اختر الخيار" : "Choose an option"}</strong><div>{product.variants.map((item) => <button key={item} className={variant === item ? "is-active" : ""} onClick={() => setVariant(item)}>{item}</button>)}</div></div> : null}<div className="purchase-row"><div className="quantity-control large"><button onClick={() => setQty(Math.max(1, qty - 1))}><Minus/></button><span>{qty}</span><button onClick={() => setQty(Math.min(product.stock, qty + 1))}><Plus/></button></div><button className="button button-dark button-large" onClick={() => addToCart(product.id, qty, variant || undefined)} disabled={!product.stock}><ShoppingBag/>{locale === "ar" ? "أضف للسلة" : "Add to cart"}</button><button className={`icon-button favorite-large ${fav ? "is-active" : ""}`} onClick={() => toggleFavorite(product.id)}><Heart fill={fav ? "currentColor" : "none"}/></button></div><div className="service-points"><span><Truck/>{locale === "ar" ? "توصيل حسب منطقة المتجر" : "Delivery by store area"}</span><span><ShieldCheck/>{locale === "ar" ? "طلب موثق داخل المنصة" : "Platform-recorded order"}</span></div>{platformSettings.messagingEnabled && <Link className="button button-ghost product-message-button" href={`/${locale}/messages?store=${encodeURIComponent(store.slug)}&product=${encodeURIComponent(product.id)}`}><MessageCircle />{locale === "ar" ? "اسأل المتجر عن هذا المنتج" : "Ask the store about this product"}</Link>}</div></div>{related.length > 0 && <div className="section nested"><div className="section-head small"><div><span className="eyebrow">MORE FROM THIS STORE</span><h2>{locale === "ar" ? "منتجات أخرى" : "More products"}</h2></div></div><div className="product-grid">{related.map((item) => <ProductCard key={item.id} product={item} store={store}/>)}</div></div>}</section></PublicShell>;
}
