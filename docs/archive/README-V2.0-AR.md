# تشغيل Tijvorya 2.0

## المتطلبات
- Node.js 20.9 أو أحدث
- npm
- مشروع Supabase
- حساب Cloudinary للوسائط
- مفتاح OpenAI اختياري للميزات الذكية الحية

## التشغيل المحلي

```bash
copy .env.example .env.local
npm ci
npm run dev
```

افتح `http://localhost:3000/ar`.

## قاعدة البيانات
- مشروع جديد: نفّذ `supabase/schema.sql`.
- مشروع محدث من 1.8: نفّذ `supabase/migrations/20260731_v2_0_global_foundation.sql`.

## التحقق قبل النشر

```bash
npm run typecheck
npm run lint
npm run build
```

أو:

```bash
npm run verify
```

## النشر
- اضبط كل متغيرات `.env.example` في منصة الاستضافة.
- اجعل `NEXT_PUBLIC_DEMO_MODE=false`.
- لا تعرض مفاتيح الخادم الحساسة في المتصفح.
- استخدم HTTPS ونطاقًا رسميًا.
- راجع `GLOBAL-LAUNCH-REPORT-AR.md` لقائمة الإطلاق الكاملة.
