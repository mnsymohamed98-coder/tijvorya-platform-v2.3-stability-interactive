import type { Order } from "@/types";
import { formatMoney } from "@/lib/utils";

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - day);
  return copy;
}

export function SalesChart({ locale, orders }: { locale: "ar" | "en"; orders: Order[] }) {
  const now = new Date();
  const currentWeek = startOfWeek(now);
  const weeks = Array.from({ length: 12 }, (_, index) => {
    const start = new Date(currentWeek);
    start.setDate(start.getDate() - (11 - index) * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const value = orders
      .filter((order) => order.status === "completed")
      .filter((order) => {
        const created = new Date(order.createdAt);
        return created >= start && created < end;
      })
      .reduce((sum, order) => sum + order.total, 0);
    return { start, value };
  });
  const max = Math.max(1, ...weeks.map((week) => week.value));
  const points = weeks.map((week, index) => `${index * 40},${120 - (week.value / max) * 96}`).join(" ");
  const last = weeks.at(-1)?.value ?? 0;
  const total = weeks.reduce((sum, week) => sum + week.value, 0);

  return <div className="chart-card">
    <div className="card-head"><div><span className="eyebrow">{locale === "ar" ? "الأداء الفعلي" : "Actual performance"}</span><h3>{locale === "ar" ? "المبيعات المكتملة خلال 12 أسبوعًا" : "Completed sales over 12 weeks"}</h3></div><span className="real-data-badge">{locale === "ar" ? "بيانات فعلية" : "Live data"}</span></div>
    <div className="chart-wrap"><svg viewBox="0 0 440 140" role="img" aria-label={locale === "ar" ? "رسم المبيعات الفعلية" : "Actual sales chart"}><defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="currentColor" stopOpacity=".24"/><stop offset="100%" stopColor="currentColor" stopOpacity="0"/></linearGradient></defs><g className="chart-grid"><line x1="0" y1="20" x2="440" y2="20"/><line x1="0" y1="60" x2="440" y2="60"/><line x1="0" y1="100" x2="440" y2="100"/></g><polyline className="chart-area" points={`0,140 ${points} 440,140`} fill="url(#chartFill)"/><polyline className="chart-line" points={points} fill="none"/>{total > 0 && <circle cx="440" cy={120 - (last / max) * 96} r="5" />}</svg></div>
    <div className="chart-legend"><span>{locale === "ar" ? "إجمالي المبيعات المكتملة في الفترة" : "Completed sales in period"}</span><strong>{formatMoney(total, locale)}</strong></div>
  </div>;
}
