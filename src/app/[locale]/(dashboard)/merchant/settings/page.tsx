"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { LoaderCircle, Save, ShieldCheck, Store } from "lucide-react";
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

  // This form edits the signed-in user's own account, not the store being
  // managed - normally the nav hides this page for an admin managing a
  // store (see dashboard-shell.tsx), but a direct link should still land
  // here safely rather than silently let admin overwrite their own profile
  // thinking it's the store's contact info.
  if (currentUser?.role === "admin") {
    return <><PageHeader eyebrow="SETTINGS" title={locale === "ar" ? "الإعدادات" : "Settings"} text="" /><div className="empty-state"><ShieldCheck /><h2>{locale === "ar" ? "هذه إعدادات حسابك الشخصي، وليست إعدادات المتجر" : "This is your own account, not the store's settings"}</h2><p>{locale === "ar" ? "تعديل الاسم أو الهاتف هنا يغيّر حساب الأدمن نفسه بغض النظر عن أي متجر تديره - وهو نفس الحساب في كل مرة، لذلك يبدو وكأنه يؤثر على كل متجر. لتغيير هاتف أو واتساب المتجر، استخدم صفحة إعدادات المتجر." : "Editing the name or phone here changes the admin account itself, regardless of which store you're managing - the same account every time, which is why it looks like it affects every store. To change the store's phone or WhatsApp, use Store settings instead."}</p><Link className="button button-dark" href={`/${locale}/merchant/store`}><Store />{locale === "ar" ? "الذهاب إلى إعدادات المتجر" : "Go to store settings"}</Link></div></>;
  }

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
