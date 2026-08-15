"use client";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Logo } from "@/components/ui/logo";
import { useApp } from "@/providers/app-provider";
export default function Page(){const{locale}=useApp();return <main className="auth-page"><section className="auth-visual"><Logo locale={locale}/><div><span className="eyebrow">PRIVACY FIRST</span><h2>{locale==="ar"?"استعد حسابك دون كشف بياناته.":"Recover access without exposing account data."}</h2><p>{locale==="ar"?"رابط مؤقت عبر البريد وجلسة محمية لتعيين كلمة مرور جديدة.":"A temporary email link and protected session for setting a new password."}</p></div></section><section className="auth-panel"><ForgotPasswordForm/></section></main>}
