"use client";

import { FormEvent, useEffect, useState } from "react";
import { LoaderCircle, Save, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { useApp } from "@/providers/app-provider";

export default function Page() {
  const { locale, currentUser, productionMode, updateAccountProfile, toast, resetDemo } = useApp();
  const [name, setName] = useState(currentUser?.fullName ?? "");
  const [phone, setPhone] = useState(currentUser?.phone ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(currentUser?.fullName ?? "");
    setPhone(currentUser?.phone ?? "");
  }, [currentUser?.fullName, currentUser?.phone]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await updateAccountProfile({ fullName: name, phone });
    } catch (error) {
      toast(error instanceof Error ? error.message : (locale === "ar" ? "تعذر حفظ الإعدادات" : "Unable to save settings"), "error");
    } finally {
      setSaving(false);
    }
  }

  return <>
    <PageHeader eyebrow="SETTINGS" title={locale === "ar" ? "الإعدادات" : "Settings"} text={locale === "ar" ? "حدّث بيانات حساب التاجر. يتم حفظ الاسم والهاتف فعليًا في ملف الحساب عند الاتصال بقاعدة البيانات." : "Update your merchant account details. Name and phone are saved to the real profile when the database is connected."} />
    <form className="editor-form" onSubmit={submit}>
      <section className="editor-card">
        <div className="card-head"><div><span className="eyebrow">ACCOUNT</span><h3>{locale === "ar" ? "بيانات الحساب" : "Account details"}</h3></div><ShieldCheck /></div>
        <div className="form-grid two">
          <label className="field"><span>{locale === "ar" ? "الاسم" : "Name"}</span><input value={name} onChange={(event) => setName(event.target.value)} minLength={2} required autoComplete="name" /></label>
          <label className="field"><span>{locale === "ar" ? "رقم الهاتف" : "Phone"}</span><input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" /></label>
        </div>
        <label className="field"><span>{locale === "ar" ? "البريد" : "Email"}</span><input type="email" value={currentUser?.email ?? ""} disabled /></label>
      </section>

      <div className="sticky-form-actions">
        <span>{productionMode ? (locale === "ar" ? "متصل بقاعدة البيانات" : "Connected to production data") : (locale === "ar" ? "وضع التطوير المحلي" : "Local development mode")}</span>
        <div>
          {!productionMode && <button type="button" className="button button-ghost" onClick={resetDemo}>{locale === "ar" ? "مسح البيانات المحلية" : "Clear local data"}</button>}
          <button className="button button-dark" disabled={saving}>{saving ? <LoaderCircle className="spin" /> : <Save />}{locale === "ar" ? "حفظ الإعدادات" : "Save settings"}</button>
        </div>
      </div>
    </form>
  </>;
}
