"use client";

import { FormEvent, useEffect, useState } from "react";
import { BadgeDollarSign, Megaphone, Plus, Target } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { useApp } from "@/providers/app-provider";
import { formatMoney, uid } from "@/lib/utils";

type Campaign = {
  id: string;
  name: string;
  type: "CPM" | "CPC";
  budget: number;
  status: "draft";
  createdAt: string;
};

export default function Page() {
  const { locale, currentUser, toast } = useApp();
  const [items, setItems] = useState<Campaign[]>([]);
  const [open, setOpen] = useState(false);
  const storageKey = `tijvorya-campaign-drafts:${currentUser?.id ?? "anonymous"}`;

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      setItems(raw ? JSON.parse(raw) as Campaign[] : []);
    } catch {
      setItems([]);
    }
  }, [storageKey]);

  function persist(next: Campaign[]) {
    setItems(next);
    window.localStorage.setItem(storageKey, JSON.stringify(next));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const budget = Number(form.get("budget"));
    if (!Number.isFinite(budget) || budget < 10) {
      toast(locale === "ar" ? "أدخل ميزانية صالحة." : "Enter a valid campaign budget.", "error");
      return;
    }
    const campaign: Campaign = {
      id: uid("cmp"),
      name: String(form.get("name") ?? "").trim(),
      type: String(form.get("type")) as "CPM" | "CPC",
      budget,
      status: "draft",
      createdAt: new Date().toISOString(),
    };
    persist([campaign, ...items]);
    event.currentTarget.reset();
    setOpen(false);
    toast(locale === "ar" ? "تم حفظ الحملة كمسودة" : "Campaign saved as a draft");
  }

  return <>
    <PageHeader eyebrow="INTERNAL ADS" title={locale === "ar" ? "الحملات الإعلانية" : "Ad campaigns"} text={locale === "ar" ? "أنشئ مسودات الحملات دون عرض أرقام أو نتائج غير حقيقية. تبدأ الإحصاءات فقط بعد ربط محرك الإعلانات الفعلي." : "Create campaign drafts without fabricated performance. Metrics begin only after a live ad engine is connected."} actions={<button className="button button-dark" type="button" onClick={() => setOpen((value) => !value)}><Plus />{locale === "ar" ? "حملة جديدة" : "New campaign"}</button>} />

    {open && <form className="editor-card campaign-form" onSubmit={submit}>
      <div className="form-grid three">
        <label className="field"><span>{locale === "ar" ? "اسم الحملة" : "Campaign name"}</span><input name="name" required minLength={2} /></label>
        <label className="field"><span>{locale === "ar" ? "نوع التسعير" : "Pricing type"}</span><select name="type"><option value="CPM">CPM</option><option value="CPC">CPC</option></select></label>
        <label className="field"><span>{locale === "ar" ? "الميزانية" : "Budget"}</span><input name="budget" type="number" min="10" step="1" required /></label>
      </div>
      <button className="button button-dark">{locale === "ar" ? "حفظ المسودة" : "Save draft"}</button>
    </form>}

    {items.length > 0 ? <div className="campaign-grid">{items.map((campaign) => <article key={campaign.id} className="editor-card">
      <div className="campaign-icon"><Megaphone /></div>
      <div><span className="status-pill status-draft">{locale === "ar" ? "مسودة" : "Draft"}</span><h3>{campaign.name}</h3><div className="campaign-metrics"><span><BadgeDollarSign />{formatMoney(campaign.budget, locale)}</span><span><Target />{campaign.type}</span><span>{locale === "ar" ? "مرات الظهور: —" : "Impressions: —"}</span><span>{locale === "ar" ? "النقرات: —" : "Clicks: —"}</span></div></div>
    </article>)}</div> : <div className="empty-state"><Megaphone /><h3>{locale === "ar" ? "لا توجد حملات حتى الآن" : "No campaigns yet"}</h3><p>{locale === "ar" ? "أنشئ مسودة عندما تكون مستعدًا. لن تعرض Tijvorya أرقام أداء قبل وجود تشغيل فعلي." : "Create a draft when ready. Tijvorya will not show performance numbers before live delivery exists."}</p></div>}

    <div className="inline-warning">{locale === "ar" ? "الحملات هنا مسودات تخطيطية فقط حاليًا. الخصم المالي والتوزيع وقياس النتائج يحتاج إلى بوابة دفع ومحرك إعلانات في بيئة الإنتاج." : "Campaigns here are planning drafts for now. Billing, distribution and performance measurement require a production payment gateway and ad engine."}</div>
  </>;
}
