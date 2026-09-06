"use client";
import { CartPanel } from "@/components/commerce/cart-panel";
import { CheckoutShell } from "@/components/layout/checkout-shell";
import { useApp } from "@/providers/app-provider";
export default function CartPage(){ const {locale}=useApp(); return <CheckoutShell locale={locale}><section className="page-hero compact"><div className="container"><span className="eyebrow">CART</span><h1>{locale==="ar"?"سلة المشتريات":"Shopping cart"}</h1></div></section><section className="section container"><CartPanel/></section></CheckoutShell>; }
