# Tijvorya v2.1.1 — Merchant Websites Hotfix

## إصلاح Build Error
- إزالة استيراد `Facebook` و`Instagram` من `lucide-react` في صفحات مواقع التجار.
- إضافة مكوّن SVG محلي للعلامتين داخل `src/components/ui/social-brand-icons.tsx`.
- تحديث `storefront-frame.tsx` وصفحة `about` لاستخدام الأيقونات المحلية.
- رفع رقم الإصدار إلى `2.1.1`.

## التحقق
- فحص Syntax لجميع ملفات TypeScript/TSX: ناجح (128 ملفًا).
- فحص جميع استيرادات `@/` الداخلية: ناجح.
- التأكد من عدم بقاء أي استيراد `Facebook` أو `Instagram` من `lucide-react`: ناجح.
