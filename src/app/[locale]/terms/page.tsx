"use client";

import { PublicShell } from "@/components/layout/public-shell";
import { useApp } from "@/providers/app-provider";

export default function TermsPage() {
  const { locale, platformSettings } = useApp();
  const ar = locale === "ar";
  return <PublicShell locale={locale}>
    <section className="page-hero compact"><div className="container narrow"><span className="eyebrow">LEGAL</span><h1>{ar ? "شروط الاستخدام" : "Terms of use"}</h1><p>{ar ? "تنظم هذه الشروط استخدام المتسوقين والتجار والإداريين لمنصة Tijvorya." : "These terms govern use of Tijvorya by shoppers, merchants and administrators."}</p></div></section>
    <section className="section container narrow legal-copy">
      <p className="legal-meta"><strong>{ar ? "آخر تحديث:" : "Last updated:"}</strong> <time dateTime="2026-07-31">{ar ? "31 يوليو 2026" : "31 July 2026"}</time></p>
      <h2>{ar ? "1. قبول الشروط والأهلية" : "1. Acceptance and eligibility"}</h2>
      <p>{ar ? "باستخدام المنصة توافق على هذه الشروط والسياسات المرتبطة بها. يجب أن تكون مؤهلًا قانونيًا لإبرام المعاملات، وأن تقدم معلومات صحيحة ومحدثة." : "By using the platform, you agree to these terms and related policies. You must be legally eligible to transact and provide accurate, current information."}</p>
      <h2>{ar ? "2. دور المنصة" : "2. Platform role"}</h2>
      <p>{ar ? "تقدم Tijvorya بنية تقنية لإنشاء المتاجر وعرض المنتجات ونشر الريلز وإدارة الطلبات والرسائل. ما لم ينص اتفاق تجاري منفصل على خلاف ذلك، يكون التاجر هو البائع المسؤول عن المنتج والسعر والمخزون والضمان والتوصيل وخدمة ما بعد البيع." : "Tijvorya provides technology for storefronts, products, reels, orders and messaging. Unless a separate commercial agreement says otherwise, the merchant is the seller responsible for products, pricing, stock, warranties, delivery and after-sales service."}</p>
      <h2>{ar ? "3. مسؤوليات التاجر" : "3. Merchant responsibilities"}</h2>
      <ul className="legal-list"><li>{ar ? "عرض وصف وصور وأسعار ومخزون وسياسات توصيل دقيقة." : "Provide accurate descriptions, images, prices, stock and delivery policies."}</li><li>{ar ? "امتلاك التراخيص والحقوق اللازمة للمنتجات والمحتوى والعلامات التجارية." : "Hold all licenses and rights required for products, content and trademarks."}</li><li>{ar ? "الامتثال لقوانين حماية المستهلك والضرائب والاستيراد والتجارة الإلكترونية." : "Comply with consumer, tax, import and e-commerce laws."}</li><li>{ar ? "عدم التلاعب بالتقييمات أو الطلبات أو التحليلات أو نظام التوصية." : "Never manipulate reviews, orders, analytics or recommendation systems."}</li></ul>
      <h2>{ar ? "4. الطلبات والدفع والإرجاع" : "4. Orders, payment and returns"}</h2>
      <p>{ar ? "تُعرض الأسعار بعملة السوق المحددة، ويعاد التحقق من السعر والمخزون عند إنشاء الطلب. وسائل الدفع ورسوم التوصيل والإلغاء والإرجاع والاسترداد تخضع لما يظهر أثناء الشراء ولسياسة التاجر والقانون المحلي. لا تُعد إضافة المنتج إلى السلة حجزًا للمخزون." : "Prices are shown in the configured market currency and are revalidated with stock when the order is created. Payment methods, delivery fees, cancellation, return and refund terms are governed by checkout disclosures, merchant policy and local law. Adding an item to the cart does not reserve stock."}</p>
      <h2>{ar ? "5. المحتوى والمنتجات المحظورة" : "5. Prohibited content and products"}</h2>
      <p>{ar ? "يُحظر المحتوى أو المنتجات غير القانونية أو الخطرة أو المضللة أو المقلدة أو المنتهكة للخصوصية أو الملكية الفكرية، وأي محتوى يحرض على الكراهية أو الاحتيال أو الاستغلال. يجوز للمنصة إزالة المحتوى أو تعليق الحساب أو إبلاغ الجهات المختصة عندما يلزم." : "Illegal, dangerous, misleading, counterfeit, privacy-invasive or infringing content and products are prohibited, as is content promoting hatred, fraud or exploitation. The platform may remove content, suspend accounts or report matters where required."}</p>
      <h2>{ar ? "6. الذكاء الاصطناعي والتوصيات" : "6. AI and recommendations"}</h2>
      <p>{ar ? "قد تساعد أدوات الذكاء الاصطناعي في كتابة المحتوى أو التحليل أو التوصية، لكنها قد تخطئ ولا تمثل ضمانًا للمبيعات أو للامتثال القانوني. يتحمل المستخدم مسؤولية مراجعة المخرجات قبل نشرها أو الاعتماد عليها." : "AI tools may assist with content, analysis or recommendations, but can be inaccurate and do not guarantee sales or legal compliance. Users must review outputs before publishing or relying on them."}</p>
      <h2>{ar ? "7. الحسابات والأمان" : "7. Accounts and security"}</h2>
      <p>{ar ? "أنت مسؤول عن حماية بيانات الدخول وعن النشاط الصادر من حسابك. يجب الإبلاغ فورًا عن أي استخدام غير مصرح به. يحظر اختبار الاختراق أو استخراج البيانات أو تجاوز القيود دون إذن كتابي." : "You are responsible for protecting credentials and activity under your account. Unauthorized use must be reported promptly. Penetration testing, scraping or bypassing controls without written authorization is prohibited."}</p>
      <h2>{ar ? "8. الملكية الفكرية" : "8. Intellectual property"}</h2>
      <p>{ar ? "تبقى ملكية محتوى التاجر والمستخدم لأصحابه، مع منح المنصة ترخيصًا محدودًا لاستضافته وعرضه وتوزيعه لتشغيل الخدمة. تبقى البرمجيات والهوية والعلامات الخاصة بالمنصة مملوكة لأصحابها." : "Merchant and user content remains owned by its owners, while the platform receives a limited license to host, display and distribute it to operate the service. Platform software, identity and marks remain the property of their owners."}</p>
      <h2>{ar ? "9. التعليق وحدود المسؤولية" : "9. Suspension and liability"}</h2>
      <p>{ar ? "يجوز تقييد أو تعليق الحسابات لحماية المستخدمين أو تنفيذ القانون أو معالجة مخالفة جوهرية. تُقدم الخدمة ضمن الحدود التي يسمح بها القانون، ولا تضمن المنصة عدم الانقطاع أو نتائج تجارية محددة. لا تستبعد هذه الشروط أي حقوق لا يجوز استبعادها قانونًا." : "Accounts may be restricted or suspended to protect users, comply with law or address a material breach. The service is provided within limits allowed by law and does not guarantee uninterrupted availability or specific business results. Nothing excludes rights that cannot legally be excluded."}</p>
      <h2>{ar ? "10. القانون والتواصل" : "10. Governing terms and contact"}</h2>
      <p>{ar ? `يجب نشر ملحق خاص بكل سوق يحدد الكيان المتعاقد والقانون والمحاكم أو آلية تسوية النزاع قبل الإطلاق التجاري في ذلك السوق. للاستفسار تواصل عبر ${platformSettings.supportEmail}.` : `A market-specific addendum identifying the contracting entity, governing law and courts or dispute process must be published before commercial launch in that market. Contact ${platformSettings.supportEmail} for questions.`}</p>
    </section>
  </PublicShell>;
}
