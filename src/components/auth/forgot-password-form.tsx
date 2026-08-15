"use client";

import Link from "next/link";
import { LoaderCircle, Mail, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { requestPasswordReset } from "@/lib/auth";
import { useApp } from "@/providers/app-provider";

export function ForgotPasswordForm() {
  const { locale, toast } = useApp();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      await requestPasswordReset(email.trim(), locale);
      setSent(true);
      toast(locale === "ar" ? "إذا كان البريد مسجلًا فستصلك رسالة استعادة." : "If the email is registered, a recovery message will arrive.");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Unable to send reset link", "error");
    } finally {
      setLoading(false);
    }
  }

  return <form className="auth-form" onSubmit={submit}>
    <div className="auth-heading"><span className="eyebrow">ACCOUNT RECOVERY</span><h1>{locale === "ar" ? "استعادة كلمة المرور" : "Recover your password"}</h1><p>{locale === "ar" ? "سنرسل رابطًا آمنًا إلى بريدك دون الكشف عمّا إذا كان الحساب موجودًا." : "We will send a secure link without revealing whether an account exists."}</p></div>
    <label className="field"><span>{locale === "ar" ? "البريد الإلكتروني" : "Email"}</span><div className="input-with-icon"><Mail /><input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></div></label>
    <button className="button button-dark button-block" disabled={loading || sent}>{loading ? <LoaderCircle className="spin" /> : <ShieldCheck />}{sent ? (locale === "ar" ? "تم إرسال الطلب" : "Request sent") : (locale === "ar" ? "إرسال رابط الاستعادة" : "Send recovery link")}</button>
    <p className="auth-switch"><Link href={`/${locale}/login`}>{locale === "ar" ? "العودة لتسجيل الدخول" : "Back to sign in"}</Link></p>
  </form>;
}
