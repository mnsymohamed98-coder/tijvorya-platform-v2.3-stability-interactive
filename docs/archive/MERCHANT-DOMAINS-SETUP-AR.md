# إعداد دومينات متاجر Tijvorya

أصبح لكل متجر نطاق فرعي مستقل مبني على اسم الرابط الذي يختاره التاجر، مثل:

- `malabis.tijvorya.com`
- `noor-fashion.tijvorya.com`

## الصفحات

- الرئيسية: `https://malabis.tijvorya.com`
- المنتجات: `https://malabis.tijvorya.com/products`
- عن المتجر: `https://malabis.tijvorya.com/about`
- الإنجليزية: `https://malabis.tijvorya.com/en`

## المطلوب مرة واحدة عند النشر

1. امتلاك/إدارة الدومين `tijvorya.com`.
2. إنشاء Wildcard DNS باسم `*.tijvorya.com` وتوجيهه إلى نفس مشروع الاستضافة.
3. إضافة `*.tijvorya.com` كـ wildcard domain داخل منصة الاستضافة إن كانت تتطلب ذلك.
4. ضبط متغيرات البيئة:

```env
NEXT_PUBLIC_STOREFRONT_ROOT_DOMAIN=tijvorya.com
NEXT_PUBLIC_STOREFRONT_SUBDOMAINS=true
```

5. تشغيل migration:

```text
supabase/migrations/20260815_v2_2_store_domains.sql
```

## التطوير المحلي

عند عدم تفعيل `NEXT_PUBLIC_STOREFRONT_SUBDOMAINS=true` يستخدم التطبيق روابط المسار الداخلية تلقائيًا، لذلك يمكن اختبار المتاجر محليًا دون إعداد DNS.

## ملاحظة

هذا الإصدار يوفر Subdomain مستقلًا لكل تاجر تحت Tijvorya. ربط دومين خارجي يملكه التاجر مثل `merchant.com` يحتاج تدفق تحقق DNS/ملكية منفصل ويمكن إضافته كميزة لاحقة.
