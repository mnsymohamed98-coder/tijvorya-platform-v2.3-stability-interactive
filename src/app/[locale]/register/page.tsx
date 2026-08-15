"use client";
import { RegisterForm } from "@/components/auth/register-form";
import { Logo } from "@/components/ui/logo";
import { useApp } from "@/providers/app-provider";
export default function RegisterPage(){const{locale}=useApp();return <main className="auth-page"><section className="auth-visual register"><Logo locale={locale}/><div><span className="eyebrow">BUILD. PUBLISH. SELL.</span><h2>{locale==="ar"?"ابدأ متجرًا قابلًا للبيع من الفيديو.":"Launch a store designed to sell from video."}</h2><p>{locale==="ar"?"أنشئ الهوية، أضف المنتجات، ارفع الريلز واستقبل الطلبات.":"Build the identity, add products, upload reels and receive orders."}</p></div></section><section className="auth-panel"><RegisterForm/></section></main>;}