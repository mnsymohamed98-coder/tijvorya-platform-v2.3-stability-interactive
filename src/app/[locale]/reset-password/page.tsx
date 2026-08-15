"use client";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Logo } from "@/components/ui/logo";
import { useApp } from "@/providers/app-provider";
export default function Page(){const{locale}=useApp();return <main className="auth-page"><section className="auth-visual register"><Logo locale={locale}/><div><span className="eyebrow">ACCOUNT SECURITY</span><h2>{locale==="ar"?"كلمة مرور أقوى، حساب أكثر أمانًا.":"A stronger password for a safer account."}</h2><p>{locale==="ar"?"استخدم كلمة فريدة ومدير كلمات مرور عند الإمكان.":"Use a unique password and a password manager whenever possible."}</p></div></section><section className="auth-panel"><ResetPasswordForm/></section></main>}
