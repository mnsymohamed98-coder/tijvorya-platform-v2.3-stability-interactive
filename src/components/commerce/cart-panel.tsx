"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { useApp } from "@/providers/app-provider";
import { formatMoney } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { PersistentImage } from "@/components/ui/persistent-media";
import { getProductsByIds } from "@/lib/supabase/repository";

export function CartPanel() {
  const { locale, cart, products, stores, updateCartQuantity, removeFromCart, productionMode, mergeProducts } = useApp();

  // The cart persists across sessions and can reference a product that
  // isn't in the currently-cached slice - resolve any such lines directly
  // instead of silently dropping them (see the `.filter(entry => entry.product)` below).
  useEffect(() => {
    if (!productionMode) return;
    const knownIds = new Set(products.map((product) => product.id));
    const missingIds = cart.map((item) => item.productId).filter((id) => !knownIds.has(id));
    if (missingIds.length === 0) return;
    let active = true;
    getProductsByIds(missingIds).then((resolved) => { if (active) mergeProducts(resolved); }).catch(console.error);
    return () => { active = false; };
  }, [cart, products, productionMode, mergeProducts]);

  const detailed = cart.map((item) => ({ item, product: products.find((product) => product.id === item.productId) })).filter((entry) => entry.product);
  if (detailed.length === 0) return <EmptyState title={locale === "ar" ? "السلة فارغة" : "Your cart is empty"} text={locale === "ar" ? "أضف منتجًا من السوق أو مباشرة من الريلز." : "Add a product from the marketplace or reels."} action={<Link className="button button-dark" href={`/${locale}/marketplace`}>{locale === "ar" ? "اذهب للسوق" : "Explore marketplace"}</Link>} />;

  const subtotal = detailed.reduce((sum, { item, product }) => sum + (product?.price ?? 0) * item.quantity, 0);
  const store = stores.find((entry) => entry.id === detailed[0].product?.storeId);
  const delivery = Math.max(0, store?.deliveryFee ?? 0);

  return <div className="cart-layout">
    <div className="cart-items">{detailed.map(({ item, product }) => product && <article key={`${item.productId}-${item.variant ?? ""}`} className="cart-item">
      <div className="cart-image"><PersistentImage className="media-fill" src={product.image} alt={locale === "ar" ? product.name : product.nameEn} optimized sizes="80px" /></div>
      <div className="cart-info"><Link href={`/${locale}/product/${product.id}`}>{locale === "ar" ? product.name : product.nameEn}</Link>{item.variant && <span>{item.variant}</span>}<strong>{formatMoney(product.price, locale)}</strong></div>
      <div className="quantity-control" aria-label={locale === "ar" ? `كمية ${product.name}` : `${product.nameEn} quantity`}><button type="button" aria-label={locale === "ar" ? "تقليل الكمية" : "Decrease quantity"} onClick={() => updateCartQuantity(item.productId, item.quantity - 1, item.variant)}><Minus /></button><span aria-live="polite">{item.quantity}</span><button type="button" aria-label={locale === "ar" ? "زيادة الكمية" : "Increase quantity"} disabled={item.quantity >= product.stock} onClick={() => updateCartQuantity(item.productId, Math.min(product.stock, item.quantity + 1), item.variant)}><Plus /></button></div>
      <button type="button" className="icon-button danger" aria-label={locale === "ar" ? `حذف ${product.name} من السلة` : `Remove ${product.nameEn} from cart`} onClick={() => removeFromCart(item.productId, item.variant)}><Trash2 /></button>
    </article>)}</div>
    <aside className="order-summary"><h3>{locale === "ar" ? "ملخص الطلب" : "Order summary"}</h3><div><span>{locale === "ar" ? "المجموع الفرعي" : "Subtotal"}</span><strong>{formatMoney(subtotal, locale)}</strong></div><div><span>{locale === "ar" ? "التوصيل" : "Delivery"}</span><strong>{delivery ? formatMoney(delivery, locale) : (locale === "ar" ? "مجاني" : "Free")}</strong></div><div className="summary-total"><span>{locale === "ar" ? "الإجمالي التقديري" : "Estimated total"}</span><strong>{formatMoney(subtotal + delivery, locale)}</strong></div><Link className="button button-dark button-block" href={`/${locale}/checkout`}>{locale === "ar" ? "متابعة إتمام الطلب" : "Continue to checkout"}</Link><small>{locale === "ar" ? "يُعاد التحقق من السعر والمخزون عند التأكيد." : "Price and stock are verified again at confirmation."}</small></aside>
  </div>;
}
