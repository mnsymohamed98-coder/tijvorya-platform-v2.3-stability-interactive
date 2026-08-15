"use client";
import { CartPanel } from "@/components/commerce/cart-panel";
import { PublicShell } from "@/components/layout/public-shell";
import { useApp } from "@/providers/app-provider";
export default function CartPage(){ const {locale}=useApp(); return <PublicShell locale={locale}><section className="page-hero compact"><div className="container"><span className="eyebrow">CART</span><h1>{locale==="ar"?"سلة المشتريات":"Shopping cart"}</h1></div></section><section className="section container"><CartPanel/></section></PublicShell>; }
