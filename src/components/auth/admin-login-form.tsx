"use client";

import { LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signInWithGoogle } from "@/lib/auth";
import { useApp } from "@/providers/app-provider";

export function AdminLoginForm() {
  const { locale, setCurrentUser, toast } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true);
    try {
      const user = await signIn(email.trim(), password);
      if (user.role !== "admin") throw new Error(locale === "ar" ? "هذا الحساب لا يملك صلاحية الإدارة" : "This account does not have admin access");
      if (user.status === "suspended") throw new Error(locale === "ar" ? "الحساب الإداري موقوف" : "Admin account is suspended");
      setCurrentUser(user);
      toast(locale === "ar" ? "تم الدخول إلى مركز التحكم" : "Signed in to control center");
      router.replace(`/${locale}/admin`);
    } catch (error) { toast(error instanceof Error ? error.message : "Admin login failed", "error"); }
    finally { setLoading(false); }
  }

  async function googleSignIn() {
    setGoogleLoading(true);
    try {
      await signInWithGoogle({ locale, admin: true, next: `/${locale}/admin` });
    } catch (error) {
      toast(error instanceof Error ? error.message : "Google sign-in failed", "error");
      setGoogleLoading(false);
    }
  }

  return <form className="auth-form admin-auth-form" onSubmit={submit}>
    <div className="admin-lock-icon"><ShieldCheck /></div>
    <div className="auth-heading"><span className="eyebrow">TIJVORYA CONTROL CENTER</span><h1>{locale === "ar" ? "مركز التحكم" : "Control center"}</h1><p>{locale === "ar" ? "منطقة خاصة ومحمية لإدارة المستخدمين والمتاجر والريلز والطلبات وإعدادات التشغيل." : "Private protected access for users, stores, reels, orders and platform operations."}</p></div>
    <button className="oauth-button" type="button" onClick={googleSignIn} disabled={googleLoading || loading}><span className="google-mark">G</span>{googleLoading && <LoaderCircle className="spin" />}{locale === "ar" ? "الدخول الإداري باستخدام Google" : "Admin sign-in with Google"}</button>
    <div className="auth-divider"><span>{locale === "ar" ? "أو البريد الإداري" : "or admin email"}</span></div>
    <label className="field"><span>{locale === "ar" ? "البريد الإداري" : "Admin email"}</span><input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
    <label className="field"><span>{locale === "ar" ? "كلمة المرور" : "Password"}</span><div className="input-with-icon"><LockKeyhole /><input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></div></label>
    <button className="button button-dark button-block" disabled={loading || googleLoading}>{loading ? <LoaderCircle className="spin" /> : <ShieldCheck />}{locale === "ar" ? "الدخول إلى مركز التحكم" : "Enter control center"}</button>
    <div className="admin-security-note"><ShieldCheck /><span>{locale === "ar" ? "لا تُمنح صلاحية الإدارة من Google تلقائيًا؛ يجب أن يكون الحساب معتمدًا مسبقًا داخل قاعدة البيانات." : "Google never grants admin access automatically; the account must already be approved in the database."}</span></div>

  </form>;
}
