"use client";

import Link from "next/link";
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { defaultPathForRole, signIn, signInWithGoogle } from "@/lib/auth";
import { safeInternalPath } from "@/lib/utils";
import { useApp } from "@/providers/app-provider";

export function LoginForm() {
  const { locale, setCurrentUser, toast } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  function requestedNext() {
    if (typeof window === "undefined") return undefined;
    return safeInternalPath(new URLSearchParams(window.location.search).get("next"), "");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const user = await signIn(email.trim(), password);
      setCurrentUser(user);
      toast(locale === "ar" ? "مرحبًا بك في Tijvorya" : "Welcome to Tijvorya");
      router.replace(requestedNext() || defaultPathForRole(locale, user.role));
    } catch (error) {
      toast(error instanceof Error ? error.message : "Login failed", "error");
    } finally {
      setLoading(false);
    }
  }

  async function googleSignIn() {
    setGoogleLoading(true);
    try {
      await signInWithGoogle({ locale, next: requestedNext() || `/${locale}/marketplace` });
    } catch (error) {
      toast(error instanceof Error ? error.message : "Google sign-in failed", "error");
      setGoogleLoading(false);
    }
  }

  return <form className="auth-form" onSubmit={submit}>
    <div className="auth-heading"><span className="eyebrow">TIJVORYA ACCESS</span><h1>{locale === "ar" ? "تسجيل الدخول" : "Sign in"}</h1><p>{locale === "ar" ? "ادخل إلى متجرك وطلباتك وريـلزك من مكان واحد." : "Access your store, orders and reels from one place."}</p></div>
    <button className="oauth-button" type="button" onClick={googleSignIn} disabled={googleLoading || loading}><span className="google-mark">G</span>{googleLoading && <LoaderCircle className="spin" />}{locale === "ar" ? "المتابعة باستخدام Google" : "Continue with Google"}</button>
    <div className="auth-divider"><span>{locale === "ar" ? "أو باستخدام البريد" : "or use email"}</span></div>
    <label className="field"><span>{locale === "ar" ? "البريد الإلكتروني" : "Email"}</span><div className="input-with-icon"><Mail /><input type="email" required autoComplete="email" inputMode="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" /></div></label>
    <label className="field"><span>{locale === "ar" ? "كلمة المرور" : "Password"}</span><div className="input-with-icon"><LockKeyhole /><input type={show ? "text" : "password"} required minLength={8} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /><button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow((value) => !value)}>{show ? <EyeOff /> : <Eye />}</button></div></label>
    <div className="form-row-between"><span className="secure-session-note"><ShieldCheck />{locale === "ar" ? "جلسة مشفرة ومحمية" : "Encrypted protected session"}</span><Link className="text-button" href={`/${locale}/forgot-password`}>{locale === "ar" ? "نسيت كلمة المرور؟" : "Forgot password?"}</Link></div>
    <button className="button button-dark button-block" disabled={loading || googleLoading}>{loading ? <LoaderCircle className="spin" /> : <ShieldCheck />}{locale === "ar" ? "دخول آمن" : "Secure sign in"}</button>

    <p className="auth-switch">{locale === "ar" ? "ليس لديك حساب؟" : "New to Tijvorya?"} <Link href={`/${locale}/register`}>{locale === "ar" ? "أنشئ حسابًا" : "Create an account"}</Link></p>
  </form>;
}
