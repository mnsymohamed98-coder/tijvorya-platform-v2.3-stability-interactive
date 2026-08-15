"use client";

import { Download, FileBarChart, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { useApp } from "@/providers/app-provider";

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export default function Page() {
  const { locale, stores, products, reels, orders, toast } = useApp();

  function exportReport() {
    const rows = [
      ["metric", "value"],
      ["stores", stores.length],
      ["products", products.length],
      ["orders", orders.length],
      ["reels", reels.length],
      ["pending_reels", reels.filter((reel) => reel.status === "pending").length],
      ["completed_orders", orders.filter((order) => order.status === "completed").length],
      ["generated_at", new Date().toISOString()],
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `tijvorya-platform-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    toast(locale === "ar" ? "تم تصدير التقرير من البيانات الحالية" : "Report exported from current data");
  }

  return <>
    <PageHeader eyebrow="REPORTING" title={locale === "ar" ? "تقارير المنصة" : "Platform reports"} actions={<button type="button" className="button button-dark" onClick={exportReport}><Download />{locale === "ar" ? "تصدير CSV" : "Export CSV"}</button>} />
    <div className="report-grid">
      <article className="editor-card"><FileBarChart /><h3>{locale === "ar" ? "ملخص التجارة" : "Commerce summary"}</h3><strong>{orders.length}</strong><span>{locale === "ar" ? "طلب مسجل" : "recorded orders"}</span></article>
      <article className="editor-card"><FileBarChart /><h3>{locale === "ar" ? "المحتوى" : "Content"}</h3><strong>{reels.length}</strong><span>{locale === "ar" ? "ريلز" : "reels"}</span></article>
      <article className="editor-card"><FileBarChart /><h3>{locale === "ar" ? "الشبكة" : "Network"}</h3><strong>{stores.length}</strong><span>{locale === "ar" ? "متاجر" : "stores"}</span></article>
      <article className="editor-card"><ShieldAlert /><h3>{locale === "ar" ? "المراجعة" : "Moderation"}</h3><strong>{reels.filter((reel) => reel.status === "pending").length}</strong><span>{locale === "ar" ? "عناصر تنتظر قرارًا" : "items awaiting decision"}</span></article>
    </div>
    <div className="inline-warning">{locale === "ar" ? `الكتالوج الحالي يحتوي ${products.length} منتجًا. ملف CSV يُنشأ من بيانات المنصة الحالية فقط.` : `The current catalog contains ${products.length} products. The CSV is generated only from current platform data.`}</div>
  </>;
}
