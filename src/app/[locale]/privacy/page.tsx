"use client";

import { PublicShell } from "@/components/layout/public-shell";
import { useApp } from "@/providers/app-provider";

export default function PrivacyPage() {
  const { locale, platformSettings } = useApp();
  const ar = locale === "ar";
  return <PublicShell locale={locale}>
    <section className="page-hero compact"><div className="container narrow"><span className="eyebrow">PRIVACY</span><h1>{ar ? "سياسة الخصوصية" : "Privacy policy"}</h1><p>{ar ? "توضح هذه السياسة البيانات اللازمة لتشغيل Tijvorya وكيفية استخدامها وحمايتها." : "This policy explains the data needed to operate Tijvorya and how it is used and protected."}</p></div></section>
    <section className="section container narrow legal-copy">
      <p className="legal-meta"><strong>{ar ? "آخر تحديث:" : "Last updated:"}</strong> <time dateTime="2026-07-31">{ar ? "31 يوليو 2026" : "31 July 2026"}</time></p>
      <h2>{ar ? "1. البيانات التي نجمعها" : "1. Data we collect"}</h2>
      <p>{ar ? "قد نعالج بيانات الحساب والاتصال، بيانات المتجر والمنتجات، تفاصيل الطلب والتوصيل، الرسائل، المحتوى المنشور، وسجلات الأمان والتشغيل. لا ينبغي إرسال كلمات المرور أو بيانات بطاقات الدفع عبر الرسائل أو نموذج التواصل." : "We may process account and contact information, store and product data, order and delivery details, messages, published content, and security or operational logs. Passwords and payment-card data should never be sent through messaging or the contact form."}</p>
      <h2>{ar ? "2. لماذا نستخدم البيانات" : "2. Why we use data"}</h2>
      <ul className="legal-list"><li>{ar ? "إنشاء الحسابات وتشغيل المتاجر والطلبات وخدمة العملاء." : "To create accounts and operate stores, orders and customer support."}</li><li>{ar ? "منع الاحتيال وإساءة الاستخدام وحماية المنصة والمستخدمين." : "To prevent fraud and abuse and protect the platform and its users."}</li><li>{ar ? "قياس الأداء وتحسين البحث والتوصيات وتجربة الاستخدام." : "To measure performance and improve search, recommendations and user experience."}</li><li>{ar ? "الالتزام بالمتطلبات القانونية والضريبية عند انطباقها." : "To meet legal and tax obligations where applicable."}</li></ul>
      <h2>{ar ? "3. ملفات الارتباط والتخزين المحلي" : "3. Cookies and local storage"}</h2>
      <p>{ar ? "تستخدم المنصة ملفات ارتباط ضرورية للمصادقة، وقد تستخدم التخزين المحلي لحفظ السلة والمفضلة وتفضيلات الريلز. لا تُفعّل أدوات تحليل أو إعلان إضافية إلا وفق إعدادات السوق والموافقات المطلوبة." : "The platform uses essential authentication cookies and may use local storage for the cart, favorites and reel preferences. Additional analytics or advertising tools are enabled only under market-specific settings and required consent."}</p>
      <h2>{ar ? "4. مزودو الخدمة ونقل البيانات" : "4. Service providers and data transfers"}</h2>
      <p>{ar ? "قد تعالج خدمات البنية السحابية وقاعدة البيانات والوسائط والذكاء الاصطناعي البيانات بالقدر اللازم لتقديم وظائفها. عند الإطلاق في سوق جديد يجب اعتماد اتفاقيات معالجة البيانات وآليات النقل الدولي المناسبة لذلك السوق." : "Cloud infrastructure, database, media and AI providers may process data only as needed to deliver their functions. Before entering a new market, appropriate data-processing agreements and international-transfer mechanisms must be approved for that market."}</p>
      <h2>{ar ? "5. الحماية والاحتفاظ" : "5. Security and retention"}</h2>
      <p>{ar ? "تستخدم النسخة الإنتاجية مصادقة وصلاحيات وعزلًا على مستوى الصفوف، مع مفاتيح حساسة محفوظة على الخادم. نحتفظ بالبيانات للمدة اللازمة لتشغيل الخدمة والوفاء بالالتزامات القانونية وحل النزاعات، ثم نحذفها أو نجعلها غير قابلة للربط عندما يكون ذلك مناسبًا." : "The production version uses authentication, permissions and row-level isolation, with sensitive keys kept server-side. Data is retained as needed to operate the service, meet legal obligations and resolve disputes, then deleted or de-identified where appropriate."}</p>
      <h2>{ar ? "6. حقوقك" : "6. Your rights"}</h2>
      <p>{ar ? "بحسب القانون المعمول به، قد يحق لك طلب الوصول أو التصحيح أو الحذف أو التقييد أو الاعتراض أو نقل نسخة من بياناتك. قد نحتاج إلى التحقق من الهوية قبل تنفيذ الطلب." : "Depending on applicable law, you may request access, correction, deletion, restriction, objection or a portable copy of your data. Identity verification may be required before fulfilling a request."}</p>
      <h2>{ar ? "7. الأطفال والتغييرات" : "7. Children and changes"}</h2>
      <p>{ar ? "المنصة ليست موجهة للأطفال دون السن القانونية في السوق المستهدف. قد نحدّث هذه السياسة عند تغير الخدمة أو المتطلبات القانونية، وسيظهر تاريخ التحديث في أعلى الصفحة." : "The platform is not directed to children below the legal age in the target market. We may update this policy as the service or legal requirements change, and the revised date will appear above."}</p>
      <h2>{ar ? "8. التواصل" : "8. Contact"}</h2>
      <p>{ar ? `للطلبات المتعلقة بالخصوصية استخدم صفحة التواصل أو البريد ${platformSettings.supportEmail}. يجب مراجعة هذه السياسة قانونيًا وتخصيصها لكل دولة قبل الإطلاق التجاري فيها.` : `For privacy requests, use the contact page or email ${platformSettings.supportEmail}. This policy must receive legal review and market-specific adaptation before commercial launch in each country.`}</p>
    </section>
  </PublicShell>;
}
