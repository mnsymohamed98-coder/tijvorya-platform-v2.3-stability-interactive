"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BadgeCheck,
  CheckCircle2,
  Film,
  Globe2,
  Languages,
  LockKeyhole,
  PackageCheck,
  PlayCircle,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  Users,
  Zap,
} from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { ProductCard } from "@/components/commerce/product-card";
import { HeroCommercePreview } from "@/components/commerce/hero-commerce-preview";
import { StoreCard } from "@/components/commerce/store-card";
import { PersistentVideo } from "@/components/ui/persistent-media";
import { HomeStructuredData } from "@/components/seo/structured-data";
import { useApp } from "@/providers/app-provider";
import { copy } from "@/lib/i18n";

export default function HomePage() {
  const { locale, products, stores, reels } = useApp();
  const t = copy[locale];
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;
  const activeStores = stores.filter((store) => (store.status ?? "active") === "active");
  const activeStoreIds = new Set(activeStores.map((store) => store.id));
  const publicProducts = products.filter((product) => product.status === "active" && activeStoreIds.has(product.storeId));
  const publicProductIds = new Set(publicProducts.map((product) => product.id));
  const approvedReels = reels.filter((reel) => reel.status === "approved" && activeStoreIds.has(reel.storeId) && publicProductIds.has(reel.productId));
  const featuredReel = approvedReels[0];
  const featuredProduct = featuredReel ? publicProducts.find((product) => product.id === featuredReel.productId) : publicProducts[0];
  const categories = Array.from(new Set(publicProducts.map((product) => product.category).filter(Boolean))).slice(0, 6);
  const launchReadyStores = activeStores.filter((store) => store.website?.onboardingCompleted === true && Boolean(store.logo));

  const pillars = locale === "ar" ? [
    { icon: PlayCircle, title: "اكتشاف يقود إلى الشراء", text: "ريلز مرتبطة مباشرة بالمنتج والسعر والمتجر، بدل فصل المحتوى عن المبيعات." },
    { icon: ShieldCheck, title: "ثقة قبل النمو", text: "توثيق المتاجر، مراجعة المحتوى، وصلاحيات واضحة للإدارة والتاجر والمتسوّق." },
    { icon: BarChart3, title: "تشغيل مبني على البيانات", text: "طلبات ومخزون ورسائل وأداء محتوى داخل لوحة واحدة قابلة للقياس." },
    { icon: Sparkles, title: "ذكاء اصطناعي مسؤول", text: "محتوى واقتراحات وتحليل أداء مع مراجعة بشرية قبل النشر." },
  ] : [
    { icon: PlayCircle, title: "Discovery that converts", text: "Reels connect directly to products, prices and stores instead of separating content from commerce." },
    { icon: ShieldCheck, title: "Trust before scale", text: "Store verification, content moderation and clear permissions for admins, merchants and shoppers." },
    { icon: BarChart3, title: "Data-led operations", text: "Orders, inventory, messaging and content performance inside one measurable workspace." },
    { icon: Sparkles, title: "Responsible AI", text: "Content, recommendations and performance analysis with human review before publishing." },
  ];

  const readiness = locale === "ar" ? [
    { icon: Languages, title: "تجربة متعددة اللغات", text: "عربية أصلية باتجاه RTL وإنجليزية باتجاه LTR، مع أساس لإضافة أسواق ولغات جديدة." },
    { icon: LockKeyhole, title: "أمان على مستوى البيانات", text: "مصادقة وصلاحيات وقواعد عزل للبيانات، مع مسار دفع يعيد حساب الأسعار من قاعدة البيانات." },
    { icon: Truck, title: "جاهزية للتوصيل والدفع", text: "بنية الطلبات قابلة للربط مع بوابات الدفع وشركات الشحن حسب كل سوق مستهدف." },
    { icon: Globe2, title: "أساس للانتشار العالمي", text: "SEO، خريطة موقع، بيانات منظمة، وروابط لغات بديلة لتحسين الاكتشاف عبر محركات البحث." },
  ] : [
    { icon: Languages, title: "Multilingual experience", text: "Native Arabic RTL and English LTR, with a foundation for adding more markets and languages." },
    { icon: LockKeyhole, title: "Data-level security", text: "Authentication, permissions and row isolation, plus checkout totals recalculated inside the database." },
    { icon: Truck, title: "Payments and delivery ready", text: "Order foundations can connect to local payment gateways and shipping providers per target market." },
    { icon: Globe2, title: "Global discovery foundation", text: "SEO metadata, sitemap, structured data and language alternates improve search-engine discovery." },
  ];

  return <PublicShell locale={locale}>
    <HomeStructuredData locale={locale} />

    <section className="hero-section hero-global"><div className="container hero-grid hero-grid-enhanced">
      <div className="hero-copy">
        <span className="hero-badge"><Zap /> {locale === "ar" ? "منصة تجارة اجتماعية قابلة للتوسع" : "A scalable social-commerce platform"}</span>
        <h1>{locale === "ar" ? "حوّل كل مشاهدة إلى فرصة شراء." : "Turn every view into a buying opportunity."}</h1>
        <p>{locale === "ar" ? "Tijvorya تجمع المتجر، المنتجات، الريلز القابلة للشراء، الطلبات والتحليلات في تجربة واحدة مصممة للتاجر والمتسوّق." : "Tijvorya unifies storefronts, products, shoppable reels, orders and analytics in one experience built for merchants and shoppers."}</p>
        <div className="hero-actions"><Link className="button button-dark button-large" href={`/${locale}/register`}>{t.start}<Arrow /></Link><Link className="button button-ghost button-large" href={`/${locale}/marketplace`}>{t.explore}</Link></div>
        <div className="trust-row"><span><CheckCircle2 />{locale === "ar" ? "عربية وإنجليزية أصلية" : "Native Arabic and English"}</span><span><CheckCircle2 />{locale === "ar" ? "شراء مباشر من الريلز" : "Direct shopping from reels"}</span><span><CheckCircle2 />{locale === "ar" ? "صلاحيات ومراجعة محتوى" : "Permissions and moderation"}</span></div>
        <div className="hero-proof"><div><BadgeCheck /><strong>{locale === "ar" ? "تجربة موثوقة" : "Trusted experience"}</strong><span>{locale === "ar" ? "متاجر ومحتوى تحت المراجعة" : "Stores and content under review"}</span></div><div><PackageCheck /><strong>{locale === "ar" ? "رحلة طلب واضحة" : "Clear order journey"}</strong><span>{locale === "ar" ? "من الاكتشاف حتى متابعة الطلب" : "From discovery to order tracking"}</span></div></div>
      </div>
      <div className="hero-visual hero-image-visual">
        <div className="hero-visual-shell">
          <div className="hero-visual-panel hero-visual-panel-top"><Sparkles />
            <div>
              <strong>{locale === "ar" ? "واجهة موحّدة للتاجر" : "Unified merchant workspace"}</strong>
              <span>{locale === "ar" ? "منتجات، طلبات، ريلز، وتحليلات داخل تجربة واحدة" : "Products, orders, reels and analytics in one experience"}</span>
            </div>
          </div>
          <div className="hero-dashboard-stage">
            <HeroCommercePreview locale={locale} products={publicProducts} stores={launchReadyStores} reels={approvedReels} />
          </div>
          <div className="hero-visual-panel hero-visual-panel-bottom"><ShoppingBag />
            <div>
              <strong>{locale === "ar" ? "متجر رسمي جاهز للإطلاق" : "Launch-ready official storefront"}</strong>
              <span>{locale === "ar" ? "هوية بصرية، دومين مستقل، وتجربة شراء احترافية" : "Brand identity, unique domain and a professional buying experience"}</span>
            </div>
          </div>
        </div>
      </div>
    </div></section>

    <section className="metrics-strip"><div className="container metrics-grid">
      <div><strong><Film /></strong><span>{locale === "ar" ? "ريلز قابلة للشراء" : "Shoppable reels"}</span></div>
      <div><strong><Store /></strong><span>{locale === "ar" ? "متاجر مستقلة" : "Independent storefronts"}</span></div>
      <div><strong><Users /></strong><span>{locale === "ar" ? "تاجر ومتسوّق وإدارة" : "Merchant, shopper and admin"}</span></div>
      <div><strong><BarChart3 /></strong><span>{locale === "ar" ? "تشغيل وتحليلات موحّدة" : "Unified operations and analytics"}</span></div>
    </div></section>

    <section className="section container"><div className="section-head"><div><span className="eyebrow">COMMERCE ENGINE</span><h2>{locale === "ar" ? "أربعة عناصر تبني منصة تُستخدم وتُوثق وتكبر." : "Four foundations for a platform people use, trust and grow with."}</h2><p>{locale === "ar" ? "الانتشار لا يبدأ بإضافة مزايا كثيرة؛ يبدأ بتجربة واضحة، ثقة قوية، تشغيل قابل للقياس، وذكاء يخدم قرار الشراء." : "Scale does not start with feature volume. It starts with clarity, trust, measurable operations and intelligence that supports buying decisions."}</p></div></div><div className="platform-pillars">{pillars.map(({ icon: Icon, title, text }) => <article className="pillar-card" key={title}><span><Icon /></span><h3>{title}</h3><p>{text}</p></article>)}</div></section>

    {categories.length > 0 && <section className="section section-soft"><div className="container"><div className="section-head"><div><span className="eyebrow">SHOP BY INTEREST</span><h2>{locale === "ar" ? "ابدأ من اهتمامك، لا من قائمة طويلة." : "Start with an interest, not a long catalogue."}</h2></div><Link href={`/${locale}/marketplace`}>{locale === "ar" ? "عرض كل المنتجات" : "View all products"}<Arrow /></Link></div><div className="category-showcase">{categories.map((category, index) => <Link className="category-link" key={category} href={`/${locale}/marketplace?category=${encodeURIComponent(category)}`}><span>{String(index + 1).padStart(2, "0")}</span><strong>{category}</strong><Arrow /></Link>)}</div></div></section>}

    <section className="section container"><div className="section-head"><div><span className="eyebrow">DISCOVER</span><h2>{locale === "ar" ? "منتجات جاهزة للاكتشاف والشراء." : "Products ready to be discovered and purchased."}</h2><p>{locale === "ar" ? "كل منتج مرتبط بمتجر فعلي ويمكن شراؤه من السوق أو مباشرة من الريلز." : "Every product belongs to a real store and can be purchased from the marketplace or directly from reels."}</p></div>{publicProducts.length > 0 && <Link href={`/${locale}/marketplace`}>{locale === "ar" ? "عرض السوق" : "View marketplace"}<Arrow /></Link>}</div>{publicProducts.length > 0 ? <div className="product-grid">{publicProducts.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} store={activeStores.find((store) => store.id === product.storeId)} />)}</div> : <div className="public-empty-showcase"><ShoppingBag /><div><strong>{locale === "ar" ? "السوق يستعد لاستقبال أول المنتجات" : "The marketplace is ready for its first products"}</strong><span>{locale === "ar" ? "عند نشر منتجات حقيقية من متجر نشط ستظهر هنا تلقائيًا." : "Real products from active stores will appear here automatically once published."}</span></div><Link className="button button-dark" href={`/${locale}/register`}>{locale === "ar" ? "ابدأ كأول تاجر" : "Start as a merchant"}<Arrow /></Link></div>}</section>

    {launchReadyStores.length > 0 && <section className="section section-soft"><div className="container"><div className="section-head"><div><span className="eyebrow">READY STORES</span><h2>{locale === "ar" ? "متاجر جاهزة بواجهة رسمية وهوية واضحة." : "Launch-ready stores with a clear and official identity."}</h2><p>{locale === "ar" ? "بدل بطاقات كبيرة مزدحمة، تظهر المتاجر الجاهزة هنا بهوية الشعار والدومين الخاص بها في ترتيب أنظف وأكثر احترافية." : "Instead of heavy promotional cards, launched stores are presented here through their logo identity and unique domain in a cleaner, more professional layout."}</p></div><Link href={`/${locale}/marketplace`}>{locale === "ar" ? "استكشف جميع المتاجر" : "Explore all stores"}<Arrow /></Link></div><div className="store-grid store-grid-logo-showcase">{launchReadyStores.slice(0, 8).map((store) => <StoreCard key={store.id} store={store} locale={locale} />)}</div></div></section>}

    <section className="section container"><div className="feature-editorial"><div className="feature-copy"><span className="eyebrow">SHOPPABLE REELS</span><h2>{locale === "ar" ? "المشاهدة بداية رحلة الطلب، وليست نهايتها." : "Watching starts the order journey instead of ending it."}</h2><p>{locale === "ar" ? "تجربة فيديو عمودية مرتبطة بالمنتج والسعر والمتجر، مع إضافة للسلة دون مغادرة المحتوى." : "A vertical video experience connected to the product, price and store, with cart actions without leaving the content."}</p><ul><li><Film />{locale === "ar" ? "تغذية ريلز شخصية قابلة للتطوير" : "A personalizable reels feed"}</li><li><ShoppingBag />{locale === "ar" ? "شراء مباشر من الفيديو" : "Direct purchase from video"}</li><li><ShieldCheck />{locale === "ar" ? "مراجعة إدارية قبل النشر" : "Moderation before publishing"}</li></ul><Link className="button button-dark" href={`/${locale}/reels`}>{locale === "ar" ? "افتح صفحة الريلز" : "Open reels"}<Arrow /></Link></div><div className="feature-phone"><div className="phone-screen">{featuredReel ? <PersistentVideo src={featuredReel.videoUrl} poster={featuredReel.cover} muted loop autoPlay playsInline /> : <div className="phone-empty"><Film /><span>{locale === "ar" ? "لا توجد ريلز منشورة بعد" : "No published reels yet"}</span></div>}<div className="phone-overlay"><span>Tijvorya Reels</span>{featuredProduct && <strong>{locale === "ar" ? featuredProduct.name : featuredProduct.nameEn}</strong>}<button type="button"><ShoppingBag />{locale === "ar" ? "أضف للسلة" : "Add to cart"}</button></div></div></div></div></section>

    <section className="section section-dark"><div className="container"><div className="section-head global-head"><div><span className="eyebrow">GLOBAL FOUNDATION</span><h2>{locale === "ar" ? "أساس تقني وتسويقي جاهز للانتقال من سوق محلي إلى أسواق متعددة." : "A technical and commercial foundation for moving from one market to many."}</h2><p>{locale === "ar" ? "التوسع العالمي يحتاج تكاملات محلية لكل بلد، لكن المنصة الآن تملك الطبقات الأساسية التي تمنع إعادة البناء من الصفر." : "Global expansion still requires local integrations per country, but the platform now has the core layers that avoid rebuilding from scratch."}</p></div></div><div className="global-readiness">{readiness.map(({ icon: Icon, title, text }) => <article className="readiness-card" key={title}><Icon /><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>

    <section className="section container"><div className="merchant-buyer-grid"><article className="journey-card"><span className="eyebrow">FOR MERCHANTS</span><h2>{locale === "ar" ? "شغّل متجرك من مساحة واحدة." : "Operate your store from one workspace."}</h2><p>{locale === "ar" ? "أضف المنتجات، أنشئ المحتوى، تابع الطلبات والمخزون والرسائل، وراجع الأداء دون أدوات متفرقة." : "Manage products, content, orders, inventory, messages and performance without fragmented tools."}</p><Link href={`/${locale}/register`}>{locale === "ar" ? "ابدأ كتاجر" : "Start as a merchant"}<Arrow /></Link></article><article className="journey-card journey-card-accent"><span className="eyebrow">FOR SHOPPERS</span><h2>{locale === "ar" ? "اكتشف بثقة واشترِ بسرعة." : "Discover with confidence and buy faster."}</h2><p>{locale === "ar" ? "تصفح السوق أو الريلز، احفظ ما يعجبك، تواصل مع المتجر، وتابع الطلب داخل المنصة." : "Browse the marketplace or reels, save favorites, message stores and track orders in one place."}</p><Link href={`/${locale}/marketplace`}>{locale === "ar" ? "ابدأ التسوق" : "Start shopping"}<Arrow /></Link></article></div></section>

    <section className="section section-soft"><div className="container"><div className="section-head"><div><span className="eyebrow">FAQ</span><h2>{locale === "ar" ? "أسئلة مهمة قبل بدء البيع." : "Important questions before you start selling."}</h2></div></div><div className="faq-grid">
      <details className="faq-item"><summary>{locale === "ar" ? "هل المنصة جاهزة للإطلاق العالمي فورًا؟" : "Is the platform ready for an immediate global launch?"}</summary><p>{locale === "ar" ? "الأساس التقني متعدد اللغات وقابل للتوسع، لكن كل سوق يحتاج بوابة دفع وشحن وضرائب وسياسات قانونية وخدمة عملاء محلية قبل الإطلاق التجاري." : "The technical foundation is multilingual and scalable, but each market still needs local payments, shipping, tax, legal policies and customer support before commercial launch."}</p></details>
      <details className="faq-item"><summary>{locale === "ar" ? "كيف تساعد الريلز في زيادة المبيعات؟" : "How do reels support sales?"}</summary><p>{locale === "ar" ? "الريلز تربط الاكتشاف بالمنتج مباشرة، وتقلل عدد الخطوات بين مشاهدة المحتوى وإضافة المنتج إلى السلة." : "Reels connect discovery directly to a product and reduce the steps between viewing content and adding an item to cart."}</p></details>
      <details className="faq-item"><summary>{locale === "ar" ? "هل ينشر الذكاء الاصطناعي تلقائيًا؟" : "Does AI publish automatically?"}</summary><p>{locale === "ar" ? "لا. أدوات الذكاء تقترح المحتوى والاستراتيجية والتحسينات، بينما يبقى القرار النهائي والمراجعة بيد المستخدم أو الإدارة." : "No. AI proposes content, strategy and improvements while final review and publishing remain under human control."}</p></details>
      <details className="faq-item"><summary>{locale === "ar" ? "كيف تُحمى الأسعار أثناء إنشاء الطلب؟" : "How are prices protected during checkout?"}</summary><p>{locale === "ar" ? "في النسخة الإنتاجية تُعاد قراءة الأسعار والمخزون ورسوم التوصيل من قاعدة البيانات داخل معاملة واحدة، ولا يتم الوثوق بإجمالي يرسله المتصفح." : "In production, prices, stock and delivery fees are recalculated inside one database transaction instead of trusting browser-submitted totals."}</p></details>
    </div></div></section>

    <section className="section container"><div className="cta-panel"><div><span className="eyebrow">START SELLING</span><h2>{locale === "ar" ? "ابنِ متجرك، اختبر السوق، ثم توسّع بالبيانات." : "Build your store, validate the market, then scale with data."}</h2><p>{locale === "ar" ? "ابدأ بالمنتجات والريلز والطلبات، ثم أضف تكاملات السوق المستهدف وفق نتائج حقيقية." : "Start with products, reels and orders, then add market-specific integrations based on real results."}</p></div><Link className="button button-light button-large" href={`/${locale}/register`}>{t.start}<Arrow /></Link></div></section>
  </PublicShell>;
}
