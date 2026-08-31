"use client";

import { LegalDocument, type LegalSection } from "@/components/legal/legal-document";
import { useApp } from "@/providers/app-provider";

export default function TermsPage() {
  const { locale, platformSettings } = useApp();
  const ar = locale === "ar";
  const email = platformSettings.supportEmail;

  const sections: LegalSection[] = ar ? [
    {
      id: "acceptance-and-eligibility", number: "1", title: "القبول والأهلية",
      blocks: [
        { type: "p", content: "بإنشائك حسابًا أو استخدامك للمنصة بأي شكل آخر، فإنك تقر بقبول هذه الشروط وأي سياسات ذات صلة مشار إليها هنا، بما في ذلك سياسة الخصوصية الخاصة بنا. أنت تقر بأنك مؤهل قانونًا لإبرام معاملات ملزمة بموجب القانون المعمول به، وأن جميع المعلومات التي تقدمها لنا دقيقة وحديثة وكاملة." },
        { type: "p", content: "إذا كنت لا توافق على هذه الشروط، يجب ألا تصل إلى المنصة أو تستخدمها." },
      ],
    },
    {
      id: "role-of-the-platform", number: "2", title: "دور المنصة",
      blocks: [
        { type: "p", content: "توفر Tijvorya البنية التقنية التي تُمكّن من إنشاء المتاجر، وعرض قوائم المنتجات، ونشر محتوى الفيديو القابل للشراء (\"الريلز\")، ومعالجة الطلبات، والمراسلة بين البائع والمشتري. ما لم ينص اتفاق تجاري كتابي منفصل بين Tijvorya والتاجر على خلاف ذلك، يعمل كل تاجر كبائع مستقل ويتحمل وحده المسؤولية الكاملة عن منتجاته وأسعاره ودقة مخزونه وضماناته وتوصيله وخدمة ما بعد البيع." },
        { type: "p", content: "لا تُعد Tijvorya طرفًا في معاملة البيع بين التاجر والمتسوق، ولا تبيع أو تملك أو تحتفظ بمخزون منتجات التاجر." },
      ],
    },
    {
      id: "merchant-responsibilities", number: "3", title: "مسؤوليات التاجر",
      blocks: [
        { type: "p", content: "يوافق التجار الذين يستخدمون المنصة على:" },
        { type: "list", items: [
          "تقديم أوصاف وصور وأسعار ومستويات مخزون وسياسات توصيل دقيقة وكاملة في جميع الأوقات.",
          "امتلاك جميع التراخيص والتصاريح وحقوق الملكية الفكرية اللازمة لبيع منتجاتهم بشكل قانوني ونشر محتواهم وعلاماتهم التجارية.",
          "الامتثال لجميع قوانين حماية المستهلك، والضرائب، والاستيراد/التصدير، والتجارة الإلكترونية المعمول بها في كل ولاية قضائية يعرضون فيها منتجاتهم للبيع.",
          "الامتناع عن التلاعب بالتقييمات، أو تضخيم الطلبات بشكل مصطنع، أو العبث بالتحليلات، أو محاولة التلاعب بأنظمة التوصية الخاصة بالمنصة.",
        ] },
        { type: "p", content: "قد يؤدي عدم الامتثال لهذه المسؤوليات إلى إزالة المحتوى، أو تعليق الحساب، أو إنهائه، وفقًا لتقدير Tijvorya." },
      ],
    },
    {
      id: "orders-payment-and-returns", number: "4", title: "الطلبات والدفع والإرجاع",
      blocks: [
        { type: "p", content: "تُعرض جميع الأسعار بعملة السوق المعمول بها، وتتم إعادة التحقق منها مقابل مستويات المخزون الحالية عند تقديم الطلب. لا تُعد إضافة عنصر إلى سلة التسوق حجزًا للمخزون أو ضمانًا لتوفره عند إتمام الشراء." },
        { type: "p", content: "تخضع طرق الدفع، ورسوم التوصيل، وإلغاء الطلبات، وأهلية الإرجاع، وشروط الاسترداد بشكل جماعي للإفصاحات المعروضة عند إتمام الشراء، وسياسة التاجر المعلنة المعمول بها، وقانون حماية المستهلك الإلزامي في الولاية القضائية ذات الصلة. وفي حال تعارض هذه المصادر، تسود أحكام القانون المعمول به." },
      ],
    },
    {
      id: "prohibited-content-and-products", number: "5", title: "المحتوى والمنتجات المحظورة",
      blocks: [
        { type: "p", content: "يُحظر تمامًا على المنصة ما يلي:" },
        { type: "list", items: [
          "المحتوى أو المنتجات غير القانونية أو الخطرة أو المضللة أو المقلدة، أو التي تنتهك حقوق الملكية الفكرية أو الخصوصية لأي طرف ثالث.",
          "المحتوى الذي يروّج للكراهية أو التمييز أو الاحتيال أو استغلال أي فرد أو مجموعة.",
        ] },
        { type: "p", content: "تحتفظ Tijvorya بالحق، وفق تقديرها المطلق، في إزالة أي محتوى، وتعليق أو إنهاء أي حساب، وإبلاغ الجهات المختصة عندما يقتضي القانون ذلك أو عندما نرى أن ذلك ضروري لحماية سلامة المنصة ومستخدميها." },
      ],
    },
    {
      id: "ai-assisted-features-and-recommendations", number: "6", title: "الميزات المدعومة بالذكاء الاصطناعي والتوصيات",
      blocks: [
        { type: "p", content: "قد تتضمن المنصة أدوات ذكاء اصطناعي للمساعدة في إنشاء المحتوى، أو تحليل الأداء، أو توصية المنتجات. تُقدَّم هذه الأدوات كوسيلة مساعدة وقد تُنتج مخرجات غير دقيقة أو غير كاملة أو غير مناسبة للسياق. لا تضمن Tijvorya دقة المحتوى الذي يُنشئه الذكاء الاصطناعي، ولا تضمن أن استخدامه سيؤدي إلى زيادة المبيعات أو تحسين الأداء أو الامتثال لأي متطلب قانوني أو تنظيمي." },
        { type: "p", content: "يتحمل المستخدمون وحدهم مسؤولية مراجعة والتحقق من صحة أي مخرجات مدعومة بالذكاء الاصطناعي قبل نشرها أو الاعتماد عليها في قرارات العمل." },
      ],
    },
    {
      id: "account-security", number: "7", title: "أمان الحساب",
      blocks: [
        { type: "p", content: "أنت المسؤول الوحيد عن الحفاظ على سرية بيانات اعتماد حسابك وعن جميع الأنشطة التي تحدث تحت حسابك. يجب عليك إخطارنا فورًا بأي وصول غير مصرح به أو اختراق أمني مشتبه به." },
        { type: "p", content: "يُحظر تمامًا أي محاولة لإجراء اختبار اختراق، أو استخراج بيانات آلي، أو تجاوز الضوابط التقنية أو الأمنية على المنصة دون إذن كتابي مسبق منا، وقد يؤدي ذلك إلى إنهاء الحساب فورًا واتخاذ إجراء قانوني." },
      ],
    },
    {
      id: "intellectual-property", number: "8", title: "الملكية الفكرية",
      blocks: [
        { type: "p", content: "يحتفظ التجار والمستخدمون بالملكية الكاملة للمحتوى والعلامات التجارية والمواد التي يرفعونها أو ينشرونها على المنصة. من خلال نشر المحتوى، فإنك تمنح Tijvorya ترخيصًا محدودًا وغير حصري وخاليًا من حقوق الملكية لاستضافة هذا المحتوى وعرضه ونسخه وتوزيعه، وذلك فقط لغرض تشغيل خدمات المنصة والترويج لها." },
        { type: "p", content: "تبقى جميع برمجيات المنصة وهويتها التجارية وأسمائها التجارية وما يرتبط بها من ملكية فكرية ملكًا حصريًا لـ Tijvorya أو الجهات المرخِّصة لها. لا تُمنح أي حقوق للمستخدمين تتجاوز ما هو منصوص عليه صراحةً في هذه الشروط." },
      ],
    },
    {
      id: "suspension-termination-and-limitation-of-liability", number: "9", title: "التعليق والإنهاء وتحديد المسؤولية",
      blocks: [
        { type: "p", content: "يجوز لـ Tijvorya تقييد أو تعليق أو إنهاء أي حساب عند الضرورة لحماية سلامة المنصة ومستخدميها، أو للامتثال للقانون المعمول به، أو لمعالجة مخالفة جوهرية لهذه الشروط." },
        { type: "p", content: "تُقدَّم المنصة \"كما هي\" و\"حسب توفرها\"، إلى أقصى حد يسمح به القانون المعمول به. لا تضمن Tijvorya توفر المنصة بشكل متواصل أو خالٍ من الأخطاء أو دون انقطاع، كما لا تضمن أي نتيجة تجارية محددة أو حجم مبيعات أو نتيجة من استخدام المنصة." },
        { type: "p", content: "لا يجوز تفسير أي بند في هذه الشروط على أنه استبعاد أو تقييد أو تنازل عن أي حق قانوني أو حماية للمستهلك لا يجوز استبعاده أو تقييده قانونًا بموجب القانون المعمول به." },
      ],
    },
    {
      id: "governing-law-and-contact", number: "10", title: "القانون الحاكم والتواصل",
      blocks: [
        { type: "p", content: "سيتم نشر ملحق خاص بكل سوق يحدد الكيان المتعاقد، والقانون الحاكم، والمحاكم المختصة أو آلية تسوية النزاعات المعمول بها في تلك الولاية القضائية، وذلك قبل إطلاق Tijvorya تجاريًا في كل سوق." },
        { type: "list", items: [<>للاستفسارات المتعلقة بهذه الشروط، يُرجى التواصل معنا عبر: <a href={`mailto:${email}`}>{email}</a></>] },
      ],
    },
  ] : [
    {
      id: "acceptance-and-eligibility", number: "1", title: "Acceptance and Eligibility",
      blocks: [
        { type: "p", content: "By creating an account or otherwise using the Platform, you confirm that you accept these Terms and any related policies referenced herein, including our Privacy Policy. You represent that you are legally capable of entering into binding transactions under applicable law, and that all information you provide to us is accurate, current, and complete." },
        { type: "p", content: "If you do not agree to these Terms, you must not access or use the Platform." },
      ],
    },
    {
      id: "role-of-the-platform", number: "2", title: "Role of the Platform",
      blocks: [
        { type: "p", content: "Tijvorya provides the technology infrastructure enabling storefronts, product listings, shoppable video content (\"reels\"), order processing, and buyer–seller messaging. Unless a separate written commercial agreement between Tijvorya and a merchant states otherwise, each merchant operates as an independent seller and bears sole responsibility for their products, pricing, stock accuracy, warranties, delivery, and after-sales service." },
        { type: "p", content: "Tijvorya is not a party to the sale transaction between a merchant and a shopper and does not itself sell, own, or hold inventory of merchant products." },
      ],
    },
    {
      id: "merchant-responsibilities", number: "3", title: "Merchant Responsibilities",
      blocks: [
        { type: "p", content: "Merchants using the Platform agree to:" },
        { type: "list", items: [
          "Provide accurate and complete product descriptions, images, pricing, stock levels, and delivery policies at all times.",
          "Hold all licenses, permits, and intellectual property rights required to lawfully sell their products and publish their content and trademarks.",
          "Comply with all applicable consumer protection, taxation, import/export, and e-commerce laws in every jurisdiction where they offer products for sale.",
          "Refrain from manipulating reviews, artificially inflating orders, tampering with analytics, or attempting to manipulate the Platform's recommendation systems.",
        ] },
        { type: "p", content: "Failure to comply with these responsibilities may result in content removal, account suspension, or termination, at Tijvorya's discretion." },
      ],
    },
    {
      id: "orders-payment-and-returns", number: "4", title: "Orders, Payment, and Returns",
      blocks: [
        { type: "p", content: "All prices are displayed in the applicable market currency and are revalidated against current stock levels at the time an order is placed. Adding an item to your cart does not reserve inventory or guarantee its availability at checkout." },
        { type: "p", content: "Payment methods, delivery fees, order cancellation, return eligibility, and refund terms are governed collectively by the disclosures presented at checkout, the applicable merchant's stated policy, and mandatory consumer protection law in the relevant jurisdiction. Where these sources conflict, applicable law shall prevail." },
      ],
    },
    {
      id: "prohibited-content-and-products", number: "5", title: "Prohibited Content and Products",
      blocks: [
        { type: "p", content: "The following are strictly prohibited on the Platform:" },
        { type: "list", items: [
          "Content or products that are illegal, dangerous, misleading, counterfeit, or infringe upon the intellectual property or privacy rights of any third party.",
          "Content that promotes hatred, discrimination, fraud, or the exploitation of any individual or group.",
        ] },
        { type: "p", content: "Tijvorya reserves the right, at its sole discretion, to remove any content, suspend or terminate any account, and report matters to relevant authorities where legally required or where we determine it necessary to protect the integrity of the Platform and its users." },
      ],
    },
    {
      id: "ai-assisted-features-and-recommendations", number: "6", title: "AI-Assisted Features and Recommendations",
      blocks: [
        { type: "p", content: "The Platform may incorporate artificial intelligence tools to assist with content generation, performance analysis, or product recommendations. These tools are provided as an aid and may produce inaccurate, incomplete, or contextually inappropriate output. Tijvorya does not warrant the accuracy of AI-generated content and does not guarantee that its use will result in increased sales, improved performance, or compliance with any legal or regulatory requirement." },
        { type: "p", content: "Users remain solely responsible for reviewing and validating any AI-assisted output before publishing it or relying on it for business decisions." },
      ],
    },
    {
      id: "account-security", number: "7", title: "Account Security",
      blocks: [
        { type: "p", content: "You are solely responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must notify us promptly of any unauthorized access or suspected security breach." },
        { type: "p", content: "Any attempt to conduct penetration testing, automated scraping, or to bypass technical or security controls on the Platform without our prior written authorization is strictly prohibited and may result in immediate account termination and legal action." },
      ],
    },
    {
      id: "intellectual-property", number: "8", title: "Intellectual Property",
      blocks: [
        { type: "p", content: "Merchants and users retain full ownership of the content, trademarks, and materials they upload or publish on the Platform. By publishing content, you grant Tijvorya a limited, non-exclusive, royalty-free license to host, display, reproduce, and distribute that content solely for the purpose of operating and promoting the Platform's services." },
        { type: "p", content: "All Platform software, branding, trade names, and associated intellectual property remain the exclusive property of Tijvorya or its licensors. No rights are granted to users beyond those expressly stated in these Terms." },
      ],
    },
    {
      id: "suspension-termination-and-limitation-of-liability", number: "9", title: "Suspension, Termination, and Limitation of Liability",
      blocks: [
        { type: "p", content: "Tijvorya may restrict, suspend, or terminate any account where necessary to protect the safety and integrity of the Platform and its users, to comply with applicable law, or to address a material breach of these Terms." },
        { type: "p", content: "The Platform is provided on an \"as is\" and \"as available\" basis, to the maximum extent permitted by applicable law. Tijvorya does not guarantee uninterrupted, error-free, or continuous availability of the Platform, nor does it guarantee any specific business outcome, sales volume, or result from use of the Platform." },
        { type: "p", content: "Nothing in these Terms shall be construed to exclude, limit, or waive any statutory right or consumer protection that cannot lawfully be excluded or limited under applicable law." },
      ],
    },
    {
      id: "governing-law-and-contact", number: "10", title: "Governing Law and Contact",
      blocks: [
        { type: "p", content: "A market-specific addendum identifying the contracting entity, the governing law, and the applicable courts or dispute-resolution process for that jurisdiction will be published prior to Tijvorya's commercial launch in each respective market." },
        { type: "list", items: [<>For questions regarding these Terms, please contact us at: <a href={`mailto:${email}`}>{email}</a></>] },
      ],
    },
  ];

  return <LegalDocument
    locale={locale}
    eyebrow="LEGAL"
    title={ar ? "شروط الاستخدام" : "Terms of Use"}
    description={ar
      ? "تشكل شروط الاستخدام هذه (\"الشروط\") اتفاقية ملزمة تحكم وصولك إلى Tijvorya (\"المنصة\") واستخدامك لها، سواء كنت متسوقًا أو تاجرًا أو مسؤولًا إداريًا. من خلال الوصول إلى المنصة أو استخدامها، فإنك توافق على الالتزام الكامل بهذه الشروط."
      : "These Terms of Use (\"Terms\") constitute a binding agreement governing your access to and use of Tijvorya (the \"Platform\"), whether as a shopper, merchant, or administrator. By accessing or using the Platform, you agree to be bound by these Terms in full."}
    tocLabel={ar ? "محتويات الصفحة" : "On this page"}
    intro={ar
      ? "تنظم هذه الشروط علاقتك بمنصة Tijvorya كمتسوق أو تاجر أو مسؤول إداري. توضح الأقسام التالية دور المنصة، ومسؤولياتك، وحدود المسؤولية، وكيفية التواصل معنا."
      : "These Terms govern your relationship with Tijvorya as a shopper, merchant, or administrator. The sections below explain the Platform's role, your responsibilities, limits of liability, and how to contact us."}
    sections={sections}
    closing={ar
      ? "تعمل Tijvorya كمنصة عالمية، وتلتزم بتكييف هذه الشروط للامتثال للقوانين والمتطلبات التنظيمية المعمول بها في كل سوق تخدمه. ستخضع هذه الشروط لمراجعة قانونية رسمية قبل الإطلاق التجاري في أي ولاية قضائية جديدة."
      : "Tijvorya operates as a global platform and is committed to adapting these Terms to comply with the applicable laws and regulatory requirements of each market it serves. These Terms will undergo formal legal review prior to commercial launch in any new jurisdiction."}
  />;
}
