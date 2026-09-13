"use client";
import { useMemo, useState } from "react";
import { CheckoutForm } from "@/components/forms/checkout-form";
import { CartPanel } from "@/components/commerce/cart-panel";
import { CheckoutShell } from "@/components/layout/checkout-shell";
import { useApp } from "@/providers/app-provider";
import type { DeliveryZone } from "@/types";
export default function CheckoutPage(){
  const {locale,cart,products,stores}=useApp();
  const [zone,setZone]=useState<DeliveryZone|"">("");
  const store=useMemo(()=>{
    const firstItem=cart[0];
    const product=firstItem?products.find((item)=>item.id===firstItem.productId):undefined;
    return product?stores.find((item)=>item.id===product.storeId):undefined;
  },[cart,products,stores]);
  const deliveryFee=zone&&store?Math.max(0,store.deliveryFees?.[zone]??0):undefined;
  return <CheckoutShell locale={locale}><section className="page-hero compact"><div className="container"><span className="eyebrow">CHECKOUT</span><h1>{locale==="ar"?"إتمام الطلب":"Checkout"}</h1></div></section><section className="section container">{cart.length?<div className="checkout-layout"><CheckoutForm zone={zone} onZoneChange={setZone} store={store} mobileSummary={<CartPanel deliveryFee={deliveryFee} hideCheckoutCta/>}/><div className="checkout-cart"><CartPanel deliveryFee={deliveryFee}/></div></div>:<CartPanel/>}</section></CheckoutShell>;
}
