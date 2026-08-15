"use client";
import { LoginForm } from "@/components/auth/login-form";
import { Logo } from "@/components/ui/logo";
import { useApp } from "@/providers/app-provider";
export default function LoginPage(){const{locale}=useApp();return <main className="auth-page"><section className="auth-visual"><Logo locale={locale}/><div><span className="eyebrow">MERCHANT OPERATING SYSTEM</span><h2>{locale==="ar"?"متجرك وطلباتك وريـلزك في مساحة تشغيل واحدة.":"Your store, orders and reels in one operating space."}</h2><p>{locale==="ar"?"واجهة تشغيل احترافية تجمع المتجر والطلبات والمحتوى في تجربة واحدة.":"A professional operating interface unifying storefront, orders and content."}</p></div></section><section className="auth-panel"><LoginForm/></section></main>;}