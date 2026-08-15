import Link from "next/link";
export default function NotFound() {
  return <main className="centered-page" dir="rtl"><div className="empty-state"><span className="eyebrow">404</span><h1>الصفحة غير موجودة</h1><p>ربما تغيّر الرابط أو حُذفت الصفحة.</p><Link className="button primary" href="/ar">العودة للرئيسية</Link></div></main>;
}
