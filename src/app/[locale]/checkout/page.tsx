"use client";
import { CheckoutForm } from "@/components/forms/checkout-form";
import { CartPanel } from "@/components/commerce/cart-panel";
import { CheckoutShell } from "@/components/layout/checkout-shell";
import { useApp } from "@/providers/app-provider";
export default function CheckoutPage(){ const {locale,cart}=useApp(); return <CheckoutShell locale={locale}><section className="page-hero compact"><div className="container"><span className="eyebrow">CHECKOUT</span><h1>{locale==="ar"?"إتمام الطلب":"Checkout"}</h1></div></section><section className="section container">{cart.length?<div className="checkout-layout"><CheckoutForm/><div className="checkout-cart"><CartPanel/></div></div>:<CartPanel/>}</section></CheckoutShell>; }
