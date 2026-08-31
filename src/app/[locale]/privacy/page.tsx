"use client";

import Link from "next/link";
import { LegalDocument, type LegalSection } from "@/components/legal/legal-document";
import { useApp } from "@/providers/app-provider";

export default function PrivacyPage() {
  const { locale, platformSettings } = useApp();
  const ar = locale === "ar";
  const email = platformSettings.supportEmail;

  const sections: LegalSection[] = ar ? [
    {
      id: "information-we-collect", number: "1", title: "المعلومات التي نجمعها",
      blocks: [
        { type: "p", content: "نجمع الفئات التالية من المعلومات بالقدر اللازم لتشغيل المنصة:" },
        { type: "list", items: [
          "معلومات الحساب: الاسم، البريد الإلكتروني، رقم الهاتف، وبيانات المصادقة.",
          "بيانات المتجر والمنتجات: بالنسبة للتجار، تشمل تفاصيل المتجر وقوائم المنتجات والأسعار وبيانات المخزون.",
          "بيانات المعاملات: سجل الطلبات، تفاصيل التوصيل، وحالة الدفع (ملاحظة: لا تُعالَج أو تُخزَّن بيانات بطاقة الدفع الكاملة مباشرة من قبل Tijvorya — راجع القسم 4).",
          "الاتصالات: الرسائل المتبادلة عبر نظام المراسلة داخل المنصة، ورسائل نموذج التواصل، وتفاعلات دعم العملاء.",
          "المحتوى الذي ينشئه المستخدم: الريلز والتعليقات والإعجابات وأي محتوى آخر تختار نشره على المنصة.",
          "البيانات التقنية والتشغيلية: معلومات الجهاز، عنوان IP، سجلات الوصول، وبيانات التشخيص الأمني، وتُجمع لحماية سلامة المنصة.",
        ] },
        { type: "callout", content: "لا نطلب أو نقبل كلمات المرور أو أرقام بطاقات الدفع الكاملة عبر الرسائل أو نموذج التواصل أو أي قناة غير مشفّرة. إذا طُلب منك مشاركة هذه المعلومات خارج نظام الدفع أو الحساب المؤمّن لدينا، يُرجى الإبلاغ عن ذلك فورًا." },
      ],
    },
    {
      id: "how-we-use-your-information", number: "2", title: "كيفية استخدامنا لمعلوماتك",
      blocks: [
        { type: "p", content: "نعالج معلوماتك للأغراض المحددة التالية:" },
        { type: "list", items: [
          "لإنشاء حسابك وإدارته، ولتشغيل إنشاء المتاجر ومعالجة الطلبات ووظائف دعم العملاء.",
          "للكشف عن الاحتيال وإساءة الاستخدام ومخالفات شروط الخدمة والتحقيق فيها ومنعها.",
          "لتحليل أداء المنصة وتحسين دقة البحث وتوصيات المنتجات وتجربة المستخدم العامة.",
          "للامتثال للالتزامات القانونية والضريبية والتنظيمية المعمول بها في الولايات القضائية التي نعمل فيها.",
        ] },
        { type: "p", content: "نحن لا نبيع معلوماتك الشخصية لأطراف ثالثة." },
      ],
    },
    {
      id: "cookies-and-local-storage", number: "3", title: "ملفات تعريف الارتباط والتخزين المحلي",
      blocks: [
        { type: "p", content: "تستخدم Tijvorya:" },
        { type: "list", items: [
          "ملفات تعريف ارتباط أساسية مطلوبة للمصادقة والحفاظ على جلسة تسجيل الدخول الخاصة بك.",
          "التخزين المحلي في المتصفح للحفاظ على سلة التسوق والمفضلة وتفضيلات مشاهدة الريلز بين الزيارات.",
        ] },
        { type: "p", content: "تُفعَّل تقنيات التحليل أو الإعلان الإضافية، عند استخدامها، فقط في أسواق محددة وفقط عند الحصول على الموافقة المطلوبة من المستخدم وفقًا للقانون المعمول به." },
      ],
    },
    {
      id: "service-providers-and-international-data-transfers", number: "4", title: "مزودو الخدمة ونقل البيانات الدولي",
      blocks: [
        { type: "p", content: "لتشغيل المنصة، نتعامل مع مزودين خارجيين للبنية التحتية السحابية، واستضافة قواعد البيانات، وتخزين الوسائط وتوصيلها، والميزات المدعومة بالذكاء الاصطناعي. يُسمح لهؤلاء المزودين تعاقديًا بمعالجة بياناتك فقط بالقدر اللازم لتقديم وظيفتهم المحددة لنا — وليس لديهم حقوق مستقلة لاستخدام بياناتك لأغراضهم الخاصة." },
        { type: "p", content: "قبل توسّع Tijvorya إلى سوق أو ولاية قضائية جديدة، نلتزم بمراجعة، وحيثما يقتضي القانون، إضفاء الطابع الرسمي على اتفاقيات معالجة البيانات المناسبة وضمانات نقل البيانات الدولية المعمول بها في ذلك السوق." },
      ],
    },
    {
      id: "data-security-and-retention", number: "5", title: "أمان البيانات والاحتفاظ بها",
      blocks: [
        { type: "p", content: "بُنيت أنظمة الإنتاج لدى Tijvorya باستخدام ضوابط مصادقة، وصلاحيات قائمة على الأدوار، وعزل بيانات على مستوى الصفوف لضمان ألا يتمكن المستخدمون والتجار من الوصول إلا إلى البيانات المصرح لهم برؤيتها. تُخزَّن بيانات الاعتماد الحساسة، بما في ذلك مفاتيح API، وتُعالَج حصريًا على بنية تحتية مؤمّنة من جانب الخادم، ولا تُكشف أبدًا للعميل أو تُنقل بنص واضح." },
        { type: "p", content: "نحتفظ بالبيانات الشخصية فقط للمدة اللازمة لتشغيل المنصة، وتحقيق الأغراض الموضحة في هذه السياسة، والوفاء بالتزاماتنا القانونية والضريبية، وحل أي نزاعات. عندما لا تعود البيانات ضرورية لهذه الأغراض، تُحذف أو يُلغى تعريفها بشكل آمن." },
      ],
    },
    {
      id: "your-rights", number: "6", title: "حقوقك",
      blocks: [
        { type: "p", content: "بحسب القوانين المعمول بها عليك، قد يحق لك:" },
        { type: "list", items: [
          "طلب الوصول إلى البيانات الشخصية التي نحتفظ بها عنك.",
          "طلب تصحيح البيانات غير الدقيقة أو غير المكتملة.",
          "طلب حذف بياناتك، مع مراعاة التزاماتنا القانونية بالاحتفاظ بالبيانات.",
          "تقييد أو الاعتراض على معالجة معينة لبياناتك.",
          "طلب نسخة قابلة للنقل من بياناتك بتنسيق منظم وشائع الاستخدام.",
        ] },
        { type: "p", content: "لممارسة أي من هذه الحقوق، تواصل معنا باستخدام البيانات الواردة في القسم 8. قد نطلب التحقق من الهوية قبل تنفيذ الطلب، لحماية بياناتك من الوصول غير المصرح به." },
      ],
    },
    {
      id: "childrens-privacy-and-policy-updates", number: "7", title: "خصوصية الأطفال وتحديثات السياسة",
      blocks: [
        { type: "p", content: "لا تستهدف Tijvorya، ولا تجمع عن علم، معلومات شخصية من الأفراد دون السن القانونية للموافقة الرقمية في ولايتهم القضائية المعمول بها. إذا علمنا أننا جمعنا مثل هذه المعلومات عن غير قصد، سنتخذ خطوات لحذفها فورًا." },
        { type: "p", content: "قد نُحدّث سياسة الخصوصية هذه من وقت لآخر لتعكس التغييرات في ممارساتنا، أو وظائف المنصة، أو المتطلبات القانونية المعمول بها. يعكس التاريخ أعلى هذه الصفحة أحدث مراجعة. سيتم إبلاغ التغييرات الجوهرية عبر المنصة عند الاقتضاء." },
      ],
    },
    {
      id: "contact-us", number: "8", title: "تواصل معنا",
      blocks: [
        { type: "p", content: "لأي أسئلة أو استفسارات أو طلبات متعلقة بسياسة الخصوصية هذه أو ببياناتك الشخصية، يُرجى التواصل معنا:" },
        { type: "list", items: [
          <>البريد الإلكتروني: <a href={`mailto:${email}`}>{email}</a></>,
          <>عبر المنصة: من خلال <Link href={`/${locale}/contact`}>صفحة التواصل</Link> الخاصة بنا</>,
        ] },
      ],
    },
  ] : [
    {
      id: "information-we-collect", number: "1", title: "Information We Collect",
      blocks: [
        { type: "p", content: "We collect the following categories of information as necessary to operate the Platform:" },
        { type: "list", items: [
          "Account information: name, email address, phone number, and authentication credentials.",
          "Store and product data: for merchants, this includes store details, product listings, pricing, and inventory information.",
          "Transaction data: order history, delivery details, and payment status (note: full payment card details are never processed or stored directly by Tijvorya — see Section 4).",
          "Communications: messages exchanged through our in-platform messaging system, contact form submissions, and customer support interactions.",
          "User-generated content: reels, comments, likes, and other content you choose to publish on the Platform.",
          "Technical and operational data: device information, IP address, access logs, and security-related diagnostic data, collected to protect the integrity of the Platform.",
        ] },
        { type: "callout", content: "We do not request or accept passwords or full payment card numbers through messages, the contact form, or any unencrypted channel. If you are asked to share this information outside of our secured checkout or account systems, please report it immediately." },
      ],
    },
    {
      id: "how-we-use-your-information", number: "2", title: "How We Use Your Information",
      blocks: [
        { type: "p", content: "We process your information for the following specific purposes:" },
        { type: "list", items: [
          "To create and manage your account, and to operate store creation, order processing, and customer support functions.",
          "To detect, investigate, and prevent fraud, abuse, and violations of our Terms of Service.",
          "To analyze platform performance and improve search accuracy, product recommendations, and overall user experience.",
          "To comply with applicable legal, tax, and regulatory obligations in the jurisdictions where we operate.",
        ] },
        { type: "p", content: "We do not sell your personal information to third parties." },
      ],
    },
    {
      id: "cookies-and-local-storage", number: "3", title: "Cookies and Local Storage",
      blocks: [
        { type: "p", content: "Tijvorya uses:" },
        { type: "list", items: [
          "Essential cookies required for authentication and maintaining your logged-in session.",
          "Local browser storage to preserve your shopping cart, favorites, and reel viewing preferences between visits.",
        ] },
        { type: "p", content: "Additional analytics or advertising technologies, where used, are activated only in specific markets and only where required user consent has been obtained in accordance with applicable law." },
      ],
    },
    {
      id: "service-providers-and-international-data-transfers", number: "4", title: "Service Providers and International Data Transfers",
      blocks: [
        { type: "p", content: "To operate the Platform, we work with third-party providers for cloud infrastructure, database hosting, media storage and delivery, and AI-assisted features. These providers are contractually permitted to process your data only to the extent necessary to deliver their specific function to us — they do not have independent rights to use your data for their own purposes." },
        { type: "p", content: "Before Tijvorya expands into a new market or jurisdiction, we commit to reviewing and, where legally required, formalizing appropriate data-processing agreements and international data-transfer safeguards applicable to that market." },
      ],
    },
    {
      id: "data-security-and-retention", number: "5", title: "Data Security and Retention",
      blocks: [
        { type: "p", content: "Tijvorya's production systems are built with authentication controls, role-based permissions, and row-level data isolation to ensure that users and merchants can only access data they are authorized to see. Sensitive credentials, including API keys, are stored and processed exclusively on secured server-side infrastructure and are never exposed to the client or transmitted in plaintext." },
        { type: "p", content: "We retain personal data only for as long as necessary to operate the Platform, fulfill the purposes described in this policy, meet our legal and tax obligations, and resolve any disputes. When data is no longer needed for these purposes, it is securely deleted or de-identified." },
      ],
    },
    {
      id: "your-rights", number: "6", title: "Your Rights",
      blocks: [
        { type: "p", content: "Depending on the laws applicable to you, you may have the right to:" },
        { type: "list", items: [
          "Request access to the personal data we hold about you.",
          "Request correction of inaccurate or incomplete data.",
          "Request deletion of your data, subject to our legal retention obligations.",
          "Restrict or object to certain processing of your data.",
          "Request a portable copy of your data in a structured, commonly used format.",
        ] },
        { type: "p", content: "To exercise any of these rights, contact us using the details in Section 8. We may require identity verification before fulfilling a request, to protect your data from unauthorized access." },
      ],
    },
    {
      id: "childrens-privacy-and-policy-updates", number: "7", title: "Children's Privacy and Policy Updates",
      blocks: [
        { type: "p", content: "Tijvorya is not directed at, and does not knowingly collect personal information from, individuals below the legal age of digital consent in their applicable jurisdiction. If we become aware that we have inadvertently collected such information, we will take steps to delete it promptly." },
        { type: "p", content: "We may update this Privacy Policy from time to time to reflect changes in our practices, the Platform's functionality, or applicable legal requirements. The date at the top of this page reflects the most recent revision. Material changes will be communicated through the Platform where appropriate." },
      ],
    },
    {
      id: "contact-us", number: "8", title: "Contact Us",
      blocks: [
        { type: "p", content: "For any questions, concerns, or requests related to this Privacy Policy or your personal data, please contact us:" },
        { type: "list", items: [
          <>Email: <a href={`mailto:${email}`}>{email}</a></>,
          <>Via the Platform: through our <Link href={`/${locale}/contact`}>Contact page</Link></>,
        ] },
      ],
    },
  ];

  return <LegalDocument
    locale={locale}
    eyebrow="PRIVACY"
    title={ar ? "سياسة الخصوصية" : "Privacy Policy"}
    description={ar
      ? "تُشغّل Tijvorya ('نحن' أو 'المنصة') سوقًا للتجارة الاجتماعية يربط بين التجار والمتسوقين من خلال محتوى فيديو قابل للشراء. توضح سياسة الخصوصية هذه كيفية جمعنا للمعلومات واستخدامها وحمايتها ومشاركتها عند استخدامك لـ Tijvorya، سواء كنت متسوقًا أو تاجرًا أو زائرًا."
      : "Tijvorya (“we,” “us,” “our,” or “the Platform”) operates a social commerce marketplace connecting merchants and shoppers through shoppable video content. This Privacy Policy explains how we collect, use, protect, and share information when you use Tijvorya, whether as a shopper, merchant, or visitor."}
    tocLabel={ar ? "محتويات الصفحة" : "On this page"}
    intro={ar
      ? "نجمع بياناتك فقط بالقدر اللازم لتشغيل المنصة بأمان وشفافية. توضح الأقسام التالية بالتفصيل ما نجمعه، ولماذا، وكيف نحميه، وما هي حقوقك."
      : "We collect your data only to the extent necessary to run the Platform safely and transparently. The sections below explain in detail what we collect, why, how we protect it, and what rights you have."}
    sections={sections}
    closing={ar
      ? "تهدف هذه السياسة إلى عكس ممارسات Tijvorya الحالية لمعالجة البيانات بحسن نية. قبل الإطلاق التجاري في أي دولة أو منطقة محددة، ستخضع هذه السياسة لمراجعة قانونية رسمية وتكييف خاص بالسوق لضمان الامتثال الكامل لقوانين الخصوصية وحماية البيانات المحلية."
      : "This policy is intended to reflect Tijvorya's current data practices in good faith. Prior to commercial launch in any specific country or region, this policy will undergo formal legal review and market-specific adaptation to ensure full compliance with local privacy and data protection laws."}
  />;
}
