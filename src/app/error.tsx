"use client";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const goHome = () => {
    const locale = window.location.pathname.split("/")[1] === "en" ? "en" : "ar";
    window.location.assign(`/${locale}`);
  };
  return <main className="centered-page" dir="rtl"><div className="empty-state"><span className="eyebrow danger-text">خطأ</span><h1>تعذر تحميل هذه الصفحة</h1><p>أصلحنا معالجة الوسائط المحلية وحالات الريلز. جرّب إعادة التحميل، أو ارجع إلى الرئيسية.</p><div className="hero-actions"><button className="button button-dark" onClick={reset}>إعادة المحاولة</button><button className="button button-ghost" onClick={goHome}>العودة للرئيسية</button></div>{process.env.NODE_ENV === "development" && <small className="error-detail">{error.message}</small>}</div></main>;
}
