function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - day);
  return copy;
}

// Same 12-week bucketing/SVG structure as SalesChart, fed with raw view
// timestamps instead of orders - kept as a separate component rather than
// generalizing SalesChart, since the two data shapes (Order[] vs raw
// timestamps) don't share enough to be worth a shared abstraction yet.
export function ReelViewsChart({ locale, viewTimestamps }: { locale: "ar" | "en"; viewTimestamps: string[] }) {
  const now = new Date();
  const currentWeek = startOfWeek(now);
  const weeks = Array.from({ length: 12 }, (_, index) => {
    const start = new Date(currentWeek);
    start.setDate(start.getDate() - (11 - index) * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const value = viewTimestamps.filter((value) => {
      const created = new Date(value);
      return created >= start && created < end;
    }).length;
    return { start, value };
  });
  const max = Math.max(1, ...weeks.map((week) => week.value));
  const points = weeks.map((week, index) => `${index * 40},${120 - (week.value / max) * 96}`).join(" ");
  const last = weeks.at(-1)?.value ?? 0;
  const total = weeks.reduce((sum, week) => sum + week.value, 0);

  return <div className="chart-card">
    <div className="card-head"><div><span className="eyebrow">{locale === "ar" ? "الأداء الفعلي" : "Actual performance"}</span><h3>{locale === "ar" ? "مشاهدات الريلز خلال 12 أسبوعًا" : "Reel views over 12 weeks"}</h3></div><span className="real-data-badge">{locale === "ar" ? "بيانات فعلية" : "Live data"}</span></div>
    <div className="chart-wrap"><svg viewBox="0 0 440 140" role="img" aria-label={locale === "ar" ? "رسم مشاهدات الريلز" : "Reel views chart"}><defs><linearGradient id="viewsChartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="currentColor" stopOpacity=".24"/><stop offset="100%" stopColor="currentColor" stopOpacity="0"/></linearGradient></defs><g className="chart-grid"><line x1="0" y1="20" x2="440" y2="20"/><line x1="0" y1="60" x2="440" y2="60"/><line x1="0" y1="100" x2="440" y2="100"/></g><polyline className="chart-area" points={`0,140 ${points} 440,140`} fill="url(#viewsChartFill)"/><polyline className="chart-line" points={points} fill="none"/>{total > 0 && <circle cx="440" cy={120 - (last / max) * 96} r="5" />}</svg></div>
    <div className="chart-legend"><span>{locale === "ar" ? "إجمالي المشاهدات في الفترة" : "Total views in period"}</span><strong>{total.toLocaleString(locale === "ar" ? "ar-PS" : "en-US")}</strong></div>
  </div>;
}
