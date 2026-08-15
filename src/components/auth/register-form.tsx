"use client";

import Link from "next/link";
import { CheckCircle2, LoaderCircle, ShieldCheck } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithGoogle, signUp } from "@/lib/auth";
import { useApp } from "@/providers/app-provider";
import type { UserRole } from "@/types";

function strongPassword(value: string) {
  return value.length >= 12 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value);
}

export function RegisterForm() {
  const { locale, setCurrentUser, toast } = useApp();
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("merchant");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const passwordReady = useMemo(() => strongPassword(password), [password]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!passwordReady) {
      toast(locale === "ar" ? "استخدم 12 حرفًا على الأقل مع حرف كبير وصغير ورقم." : "Use at least 12 characters with upper/lowercase letters and a number.", "error");
      return;
    }
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      const result = await signUp({ fullName: String(form.get("fullName") ?? ""), email: String(form.get("email") ?? ""), phone: String(form.get("phone") ?? ""), password, role });
      if (!result.hasSession) {
        toast(locale === "ar" ? "أرسلنا رابط تأكيد إلى بريدك. افتحه قبل تسجيل الدخول." : "We sent an email confirmation link. Open it before signing in.");
        router.replace(`/${locale}/login?verification=pending`);
        return;
      }
      setCurrentUser(result.user);
      toast(locale === "ar" ? "تم إنشاء الحساب" : "Account created");
      router.replace(role === "merchant" ? `/${locale}/merchant/onboarding` : `/${locale}/marketplace`);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Registration failed", "error");
    } finally {
      setLoading(false);
    }
  }

  async function googleSignUp() {
    setGoogleLoading(true);
    try {
      const next = role === "merchant" ? `/${locale}/merchant/onboarding` : `/${locale}/marketplace`;
      await signInWithGoogle({ locale, role: role === "merchant" ? "merchant" : "customer", next });
    } catch (error) {
      toast(error instanceof Error ? error.message : "Google sign-up failed", "error");
      setGoogleLoading(false);
    }
  }

  return <form className="auth-form wide" onSubmit={submit}>
    <div className="auth-heading"><span className="eyebrow">JOIN TIJVORYA</span><h1>{locale === "ar" ? "أنشئ حسابك" : "Create your account"}</h1><p>{locale === "ar" ? "ابدأ كمتسوق أو افتح متجرًا قابلًا للبيع بالفيديو." : "Join as a shopper or open a store built for video commerce."}</p></div>

    <div className="role-picker"><button type="button" className={role === "merchant" ? "is-active" : ""} onClick={() => setRole("merchant")}><strong>{locale === "ar" ? "تاجر" : "Merchant"}</strong><span>{locale === "ar" ? "متجر، منتجات، ريلز وطلبات" : "Store, products, reels and orders"}</span></button><button type="button" className={role === "customer" ? "is-active" : ""} onClick={() => setRole("customer")}><strong>{locale === "ar" ? "متسوق" : "Customer"}</strong><span>{locale === "ar" ? "تصفح، حفظ وشراء" : "Browse, save and shop"}</span></button></div>
    <button className="oauth-button" type="button" onClick={googleSignUp} disabled={googleLoading || loading}><span className="google-mark">G</span>{googleLoading && <LoaderCircle className="spin" />}{locale === "ar" ? "إنشاء الحساب باستخدام Google" : "Create account with Google"}</button>
    <div className="auth-divider"><span>{locale === "ar" ? "أو أنشئه بالبريد" : "or create with email"}</span></div>
    <div className="form-grid two"><label className="field"><span>{locale === "ar" ? "الاسم الكامل" : "Full name"}</span><input name="fullName" autoComplete="name" required /></label><label className="field"><span>{locale === "ar" ? "رقم الهاتف" : "Phone"}</span><input name="phone" type="tel" autoComplete="tel" required /></label></div>
    <label className="field"><span>{locale === "ar" ? "البريد الإلكتروني" : "Email"}</span><input name="email" type="email" autoComplete="email" required /></label>
    <label className="field"><span>{locale === "ar" ? "كلمة المرور" : "Password"}</span><input name="password" type="password" autoComplete="new-password" minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
    <div className={`password-policy ${passwordReady ? "is-ready" : ""}`}><CheckCircle2 /><span>{locale === "ar" ? "12 حرفًا على الأقل، وحرف كبير وصغير ورقم. يُفضّل استخدام مدير كلمات مرور." : "At least 12 characters, upper/lowercase letters and a number. A password manager is recommended."}</span></div>
    <label className="check-row"><input type="checkbox" required />{locale === "ar" ? "أوافق على شروط الاستخدام وسياسة الخصوصية" : "I agree to the terms and privacy policy"}</label>
    <button className="button button-dark button-block" disabled={loading || googleLoading}>{loading ? <LoaderCircle className="spin" /> : <ShieldCheck />}{locale === "ar" ? "إنشاء الحساب بأمان" : "Create secure account"}</button>
    <p className="auth-switch">{locale === "ar" ? "لديك حساب؟" : "Already registered?"} <Link href={`/${locale}/login`}>{locale === "ar" ? "سجّل الدخول" : "Sign in"}</Link></p>
  </form>;
}
