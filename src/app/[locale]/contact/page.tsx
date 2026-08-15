"use client";

import { FormEvent, useState } from "react";
import { LoaderCircle, Mail, MapPin, ShieldCheck } from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { useApp } from "@/providers/app-provider";

export default function ContactPage() {
  const { locale, platformSettings, toast } = useApp();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setLoading(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(form.get("name") ?? ""),
          email: String(form.get("email") ?? ""),
          inquiryType: String(form.get("inquiryType") ?? "other"),
          message: String(form.get("message") ?? ""),
          company: String(form.get("company") ?? ""),
          locale,
        }),
      });
      if (!response.ok) throw new Error(response.status === 429 ? (locale === "ar" ? "تم إرسال طلبات كثيرة. حاول لاحقًا." : "Too many requests. Try again later.") : (locale === "ar" ? "تعذر إرسال الرسالة حاليًا." : "Unable to send your message right now."));
      formElement.reset();
      setSubmitted(true);
      toast(locale === "ar" ? "تم استلام رسالتك بنجاح" : "Your message was received");
    } catch (error) {
      toast(error instanceof Error ? error.message : (locale === "ar" ? "تعذر إرسال الرسالة" : "Unable to send message"), "error");
    } finally {
      setLoading(false);
    }
  }

  return <PublicShell locale={locale}>
    <section className="page-hero compact"><div className="container"><span className="eyebrow">CONTACT</span><h1>{locale === "ar" ? "تواصل مع فريق Tijvorya" : "Contact the Tijvorya team"}</h1><p>{locale === "ar" ? "لإطلاق متجر، شراكة تجارية، دعم فني، أو استفسار إعلامي." : "For store launches, commercial partnerships, technical support or press inquiries."}</p></div></section>
    <section className="section container"><div className="contact-layout">
      <div className="contact-info"><h2>{locale === "ar" ? "لنناقش الخطوة التالية." : "Let’s discuss the next step."}</h2><p>{locale === "ar" ? "أرسل تفاصيل واضحة عن نشاطك والسوق الذي تستهدفه، وسيتمكن الفريق من تصنيف الطلب ومتابعته." : "Share clear details about your business and target market so the team can route and follow up on your request."}</p><div><Mail /><span>{platformSettings.supportEmail}</span></div><div><MapPin /><span>{locale === "ar" ? "منصة رقمية متعددة الأسواق" : "Digital, multi-market platform"}</span></div><div><ShieldCheck /><span>{locale === "ar" ? "لا نطلب كلمات المرور أو بيانات الدفع عبر هذا النموذج." : "We never request passwords or payment details through this form."}</span></div></div>
      <form className="contact-form editor-card" onSubmit={submit}>
        <div className="honeypot" aria-hidden="true"><label>Company<input name="company" tabIndex={-1} autoComplete="off" /></label></div>
        <div className="form-grid two"><label className="field"><span>{locale === "ar" ? "الاسم" : "Name"}</span><input name="name" required minLength={2} maxLength={120} autoComplete="name" /></label><label className="field"><span>{locale === "ar" ? "البريد" : "Email"}</span><input name="email" type="email" required maxLength={254} autoComplete="email" /></label></div>
        <label className="field"><span>{locale === "ar" ? "نوع الطلب" : "Inquiry type"}</span><select name="inquiryType" defaultValue="merchant"><option value="merchant">{locale === "ar" ? "فتح متجر" : "Open a store"}</option><option value="partnership">{locale === "ar" ? "شراكة" : "Partnership"}</option><option value="support">{locale === "ar" ? "دعم فني" : "Technical support"}</option><option value="press">{locale === "ar" ? "إعلام وصحافة" : "Press"}</option><option value="other">{locale === "ar" ? "استفسار آخر" : "Other"}</option></select></label>
        <label className="field"><span>{locale === "ar" ? "الرسالة" : "Message"}</span><textarea name="message" rows={7} required minLength={10} maxLength={4000} /></label>
        {submitted && <p className="contact-status" role="status">{locale === "ar" ? "وصلت رسالتك. احتفظ بنسخة من التفاصيل المهمة لديك." : "Your message was received. Keep a copy of any important details for your records."}</p>}
        <button className="button button-dark" disabled={loading}>{loading && <LoaderCircle className="spin" />}{locale === "ar" ? "إرسال الرسالة" : "Send message"}</button>
      </form>
    </div></section>
  </PublicShell>;
}
