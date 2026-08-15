"use client";

import { CheckCircle2, LoaderCircle, ShieldCheck } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { updatePassword } from "@/lib/auth";
import { useApp } from "@/providers/app-provider";

function strongPassword(value: string) {
  return value.length >= 12 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value);
}

export function ResetPasswordForm() {
  const { locale, toast } = useApp();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const ready = useMemo(() => strongPassword(password) && password === confirm, [password, confirm]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready) {
      toast(locale === "ar" ? "تحقق من قوة كلمة المرور وتطابق الحقلين." : "Check password strength and that both fields match.", "error");
      return;
    }
    setLoading(true);
    try {
      await updatePassword(password, locale);
      toast(locale === "ar" ? "تم تحديث كلمة المرور بأمان." : "Password updated securely.");
      router.replace(`/${locale}/login`);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Unable to update password", "error");
    } finally {
      setLoading(false);
    }
  }

  return <form className="auth-form" onSubmit={submit}>
    <div className="auth-heading"><span className="eyebrow">SECURE PASSWORD</span><h1>{locale === "ar" ? "تعيين كلمة مرور جديدة" : "Set a new password"}</h1><p>{locale === "ar" ? "استخدم كلمة فريدة لا تستعملها في أي موقع آخر." : "Use a unique password that you do not use on another site."}</p></div>
    <label className="field"><span>{locale === "ar" ? "كلمة المرور الجديدة" : "New password"}</span><input type="password" autoComplete="new-password" minLength={12} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
    <label className="field"><span>{locale === "ar" ? "تأكيد كلمة المرور" : "Confirm password"}</span><input type="password" autoComplete="new-password" minLength={12} required value={confirm} onChange={(event) => setConfirm(event.target.value)} /></label>
    <div className={`password-policy ${ready ? "is-ready" : ""}`}><CheckCircle2 /><span>{locale === "ar" ? "12 حرفًا على الأقل مع حرف كبير وصغير ورقم، والحقلان متطابقان." : "At least 12 characters with upper/lowercase letters and a number, and both fields match."}</span></div>
    <button className="button button-dark button-block" disabled={loading}>{loading ? <LoaderCircle className="spin" /> : <ShieldCheck />}{locale === "ar" ? "حفظ كلمة المرور" : "Save password"}</button>
  </form>;
}
