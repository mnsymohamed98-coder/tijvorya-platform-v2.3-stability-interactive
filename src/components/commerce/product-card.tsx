"use client";

import Link from "next/link";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { useApp } from "@/providers/app-provider";
import { PersistentImage } from "@/components/ui/persistent-media";
import { formatMoney } from "@/lib/utils";
import type { Product, Store } from "@/types";
import { merchantStoreHref } from "@/lib/store-website";

export function ProductCard({ product, store }: { product: Product; store?: Store }) {
  const { locale, addToCart, favoriteIds, toggleFavorite } = useApp();
  const isFavorite = favoriteIds.includes(product.id);
  const productName = locale === "ar" ? product.name : product.nameEn;
  const labels = locale === "ar"
    ? { view: `عرض ${productName}`, add: `أضف ${productName} إلى السلة`, favorite: isFavorite ? `إزالة ${productName} من المفضلة` : `إضافة ${productName} إلى المفضلة`, verified: "متجر موثّق" }
    : { view: `View ${productName}`, add: `Add ${productName} to cart`, favorite: isFavorite ? `Remove ${productName} from favorites` : `Add ${productName} to favorites`, verified: "Verified store" };

  return <article className="product-card">
    <div className="product-media">
      <Link href={`/${locale}/product/${product.id}`} aria-label={labels.view}><PersistentImage className="media-fill" src={product.image} alt={productName} /></Link>
      {product.compareAtPrice && product.compareAtPrice > product.price && <span className="discount-tag">-{Math.round((1 - product.price / product.compareAtPrice) * 100)}%</span>}
      <button type="button" className={`favorite-button ${isFavorite ? "is-active" : ""}`} onClick={() => toggleFavorite(product.id)} aria-label={labels.favorite} aria-pressed={isFavorite}><Heart fill={isFavorite ? "currentColor" : "none"} /></button>
    </div>
    <div className="product-body">
      {store && <Link className="store-kicker" href={merchantStoreHref(store.slug, locale)}>{locale === "ar" ? store.name : store.nameEn}{store.verified && <span className="verified-dot" title={labels.verified} aria-label={labels.verified}>✓</span>}</Link>}
      <Link className="product-title" href={`/${locale}/product/${product.id}`}>{productName}</Link>
      <div className="rating-row">{product.rating > 0 && <><Star size={15} fill="currentColor" /><span>{product.rating.toFixed(1)}</span><span className="muted">·</span></>}<span className="muted">{product.stock} {locale === "ar" ? "متوفر" : "in stock"}</span></div>
      <div className="product-price-row"><strong>{formatMoney(product.price, locale)}</strong>{product.compareAtPrice && product.compareAtPrice > product.price && <del>{formatMoney(product.compareAtPrice, locale)}</del>}</div>
      <button type="button" className="button button-dark button-block" disabled={product.stock < 1} onClick={() => addToCart(product.id)} aria-label={labels.add}><ShoppingBag size={17} />{product.stock > 0 ? (locale === "ar" ? "أضف للسلة" : "Add to cart") : (locale === "ar" ? "نفد المخزون" : "Sold out")}</button>
    </div>
  </article>;
}
