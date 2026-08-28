"use client";

import Link from "next/link";
import {
  Boxes,
  Film,
  Globe2,
  ShoppingBag,
  Sparkles,
  Store,
  Share2,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusPill } from "@/components/ui/status-pill";
import { merchantStoreHref } from "@/lib/store-website";
import { useApp } from "@/providers/app-provider";
import { formatMoney } from "@/lib/utils";

export default function MerchantDashboard() {
  const {
    locale,
    stores,
    products,
    reels,
    orders,
    currentUser,
    toast,
  } = useApp();

  const store = stores.find(
    (item) => item.ownerId === currentUser?.id
  );

  const storeProducts = products.filter(
    (item) => item.storeId === store?.id
  );

  const storeOrders = orders.filter(
    (item) => item.storeId === store?.id
  );

  const storeReels = reels.filter(
    (item) => item.storeId === store?.id
  );

  const sales = storeOrders
    .filter((item) => item.status === "completed")
    .reduce((sum, order) => sum + order.total, 0);

  const pendingOrders = storeOrders.filter(
    (item) =>
      !["completed", "cancelled"].includes(item.status)
  ).length;

  const lowStock = storeProducts.filter(
    (item) =>
      item.status === "active" &&
      item.stock < 5
  ).length;

  const reelViews = storeReels.reduce(
    (sum, reel) => sum + reel.views,
    0
  );

  const topReel = [...storeReels].sort(
    (a, b) => b.views - a.views
  )[0];

  const readinessChecks = [
    Boolean(store?.website?.onboardingCompleted),
    Boolean(store?.logo && store?.cover),
    storeProducts.some(
      (item) => item.status === "active"
    ),
    Boolean(
      store?.phone &&
        store?.website?.shippingAreas &&
        store?.website?.returnPolicy
    ),
  ];

  const readiness = Math.round(
    (readinessChecks.filter(Boolean).length /
      readinessChecks.length) *
      100
  );

  const suggestion = !store
    ? {
        titleAr: "أكمل إعداد موقع متجرك",
        titleEn: "Finish your storefront setup",
        bodyAr:
          "أدخل بيانات النشاط والشعار والغلاف ليصبح موقعك جاهزًا للعمل.",
        bodyEn:
          "Add your business details, logo and cover to make your storefront ready.",
      }
    : storeProducts.length === 0
      ? {
          titleAr: "أضف أول منتج",
          titleEn: "Add your first product",
          bodyAr:
            "متجرك جاهز، لكن الكتالوج ما زال فارغًا. أضف منتجًا كامل التفاصيل ليظهر في موقعك.",
          bodyEn:
            "Your storefront is ready, but the catalog is empty. Add a complete product to publish it.",
        }
      : storeReels.length === 0
        ? {
            titleAr:
              "أنشئ أول ريلز للمنتجات",
            titleEn:
              "Create your first product reel",
            bodyAr:
              "لديك منتجات منشورة. أضف ريلز حقيقيًا لعرض المنتج وربطه مباشرة بصفحة الشراء.",
            bodyEn:
              "You have published products. Add a real reel and link it directly to a product.",
          }
        : {
            titleAr:
              "استخدم بياناتك الفعلية لتحسين المحتوى",
            titleEn:
              "Use your actual data to improve content",
            bodyAr: topReel
              ? `أعلى ريلز لديك حاليًا حقق ${topReel.views.toLocaleString(
                  "ar-PS"
                )} مشاهدة. قارن أداءه ببقية المحتوى قبل نشر النسخة التالية.`
              : "راجع أداء الريلز والطلبات قبل اتخاذ قرار المحتوى التالي.",
            bodyEn: topReel
              ? `Your current top reel has ${topReel.views.toLocaleString(
                  "en-US"
                )} views. Compare it with other content before your next post.`
              : "Review reel and order performance before your next content decision.",
          };

  async function shareStore() {
    if (!store) return;

    const relativeUrl = merchantStoreHref(
      store.slug,
      locale
    );

    const storeUrl =
      typeof window !== "undefined"
        ? new URL(
            relativeUrl,
            window.location.origin
          ).toString()
        : relativeUrl;

    const storeName =
      locale === "ar"
        ? store.name
        : store.nameEn || store.name;

    try {
      if (
        typeof navigator !== "undefined" &&
        navigator.share
      ) {
        await navigator.share({
          title: `${storeName} | Tijvorya`,
          text:
            locale === "ar"
              ? `اكتشف متجر ${storeName} على Tijvorya`
              : `Discover ${storeName} on Tijvorya`,
          url: storeUrl,
        });

        return;
      }

      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard
      ) {
        await navigator.clipboard.writeText(
          storeUrl
        );

        toast(
          locale === "ar"
            ? "تم نسخ رابط المتجر."
            : "Store link copied."
        );

        return;
      }

      throw new Error(
        "SHARE_NOT_SUPPORTED"
      );
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          storeUrl
        );

        toast(
          locale === "ar"
            ? "تم نسخ رابط المتجر."
            : "Store link copied."
        );
      } catch {
        toast(
          locale === "ar"
            ? "تعذر مشاركة رابط المتجر."
            : "Unable to share store link.",
          "error"
        );
      }
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="MERCHANT OVERVIEW"
        title={
          locale === "ar"
            ? `مرحبًا ${currentUser?.fullName ?? ""}`
            : `Welcome ${currentUser?.fullName ?? ""}`
        }
        text={
          locale === "ar"
            ? "لوحة تعتمد على بيانات متجرك الفعلية فقط."
            : "An operational dashboard based only on your actual store data."
        }
        actions={
          <>
            <Link
              className="button button-ghost"
              href={`/${locale}/merchant/products/new`}
            >
              <Boxes />
              {locale === "ar"
                ? "منتج جديد"
                : "New product"}
            </Link>

            <Link
              className="button button-dark"
              href={`/${locale}/merchant/reels/new`}
            >
              <Film />
              {locale === "ar"
                ? "رفع ريلز"
                : "Upload reel"}
            </Link>
          </>
        }
      />

      {store?.website?.onboardingCompleted && (
        <section className="merchant-domain-card">
          <div>
            <span>
              <Globe2 />
            </span>

            <div>
              <small>
                {locale === "ar"
                  ? "دومين متجرك"
                  : "Your store domain"}
              </small>

              <strong>
                {store.website.domain ||
                  `${store.slug}.tijvorya.com`}
              </strong>

              <p>
                {locale === "ar"
                  ? "هذا هو العنوان المستقل الذي يمكنك مشاركته مع العملاء."
                  : "Share this dedicated address directly with customers."}
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              className="button button-dark"
              onClick={() => void shareStore()}
            >
              <Share2 />
              {locale === "ar"
                ? "مشاركة المتجر"
                : "Share store"}
            </button>

            <a
              className="button button-ghost"
              href={merchantStoreHref(
                store.slug,
                locale
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Globe2 />
              {locale === "ar"
                ? "فتح الموقع"
                : "Open website"}
            </a>
          </div>
        </section>
      )}

      <div className="stats-grid">
        <StatCard
          label={
            locale === "ar"
              ? "المبيعات المكتملة"
              : "Completed sales"
          }
          value={formatMoney(sales, locale)}
          note={
            locale === "ar"
              ? "من الطلبات المكتملة فقط"
              : "Completed orders only"
          }
          icon={ShoppingBag}
          trend="neutral"
        />

        <StatCard
          label={
            locale === "ar"
              ? "الطلبات"
              : "Orders"
          }
          value={String(storeOrders.length)}
          note={
            locale === "ar"
              ? `${pendingOrders} قيد التنفيذ`
              : `${pendingOrders} in progress`
          }
          icon={ShoppingBag}
          trend="neutral"
        />

        <StatCard
          label={
            locale === "ar"
              ? "المنتجات"
              : "Products"
          }
          value={String(storeProducts.length)}
          note={
            locale === "ar"
              ? `${lowStock} منخفضة المخزون`
              : `${lowStock} low stock`
          }
          icon={Boxes}
          trend={
            lowStock
              ? "down"
              : "neutral"
          }
        />

        <StatCard
          label={
            locale === "ar"
              ? "مشاهدات الريلز"
              : "Reel views"
          }
          value={reelViews.toLocaleString(
            locale === "ar"
              ? "ar-PS"
              : "en-US"
          )}
          note={
            locale === "ar"
              ? `${storeReels.length} ريلز`
              : `${storeReels.length} reels`
          }
          icon={Film}
          trend="neutral"
        />
      </div>

      <div className="dashboard-grid-main">
        <SalesChart
          locale={locale}
          orders={storeOrders}
        />

        <article className="ai-operation-card">
          <div className="card-head">
            <div>
              <span className="eyebrow">
                NEXT ACTION
              </span>

              <h3>
                {locale === "ar"
                  ? "اقتراح مبني على حالة متجرك"
                  : "Suggestion based on your store"}
              </h3>
            </div>

            <Sparkles />
          </div>

          <div className="ai-product-preview">
            <div>
              <strong>
                {locale === "ar"
                  ? suggestion.titleAr
                  : suggestion.titleEn}
              </strong>

              <p>
                {locale === "ar"
                  ? suggestion.bodyAr
                  : suggestion.bodyEn}
              </p>
            </div>
          </div>

          <Link
            className="button button-ghost"
            href={`/${locale}/merchant/ai-studio`}
          >
            {locale === "ar"
              ? "فتح استوديو AI"
              : "Open AI Studio"}
          </Link>
        </article>
      </div>

      <div className="dashboard-grid-lower">
        <article className="editor-card">
          <div className="card-head">
            <div>
              <span className="eyebrow">
                RECENT ORDERS
              </span>

              <h3>
                {locale === "ar"
                  ? "أحدث الطلبات"
                  : "Recent orders"}
              </h3>
            </div>

            <Link
              href={`/${locale}/merchant/orders`}
            >
              {locale === "ar"
                ? "عرض الكل"
                : "View all"}
            </Link>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>
                    {locale === "ar"
                      ? "الطلب"
                      : "Order"}
                  </th>

                  <th>
                    {locale === "ar"
                      ? "العميل"
                      : "Customer"}
                  </th>

                  <th>
                    {locale === "ar"
                      ? "الحالة"
                      : "Status"}
                  </th>

                  <th>
                    {locale === "ar"
                      ? "القيمة"
                      : "Value"}
                  </th>
                </tr>
              </thead>

              <tbody>
                {storeOrders
                  .slice(0, 5)
                  .map((order) => (
                    <tr key={order.id}>
                      <td>{order.id}</td>

                      <td>
                        {order.customerName}
                      </td>

                      <td>
                        <StatusPill
                          status={order.status}
                          locale={locale}
                        />
                      </td>

                      <td>
                        {formatMoney(
                          order.total,
                          locale
                        )}
                      </td>
                    </tr>
                  ))}

                {storeOrders.length ===
                  0 && (
                  <tr>
                    <td colSpan={4}>
                      {locale === "ar"
                        ? "لا توجد طلبات حتى الآن."
                        : "No orders yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="editor-card setup-card">
          <div className="card-head">
            <div>
              <span className="eyebrow">
                STORE READINESS
              </span>

              <h3>
                {locale === "ar"
                  ? "جاهزية المتجر"
                  : "Store readiness"}
              </h3>
            </div>

            <Store />
          </div>

          <div className="progress-ring">
            <strong>{readiness}%</strong>
          </div>

          <ul>
            <li
              className={
                readinessChecks[0]
                  ? "done"
                  : ""
              }
            >
              {locale === "ar"
                ? "هوية وموقع المتجر"
                : "Store identity & website"}
            </li>

            <li
              className={
                readinessChecks[1]
                  ? "done"
                  : ""
              }
            >
              {locale === "ar"
                ? "شعار وغلاف أصليان"
                : "Original logo & cover"}
            </li>

            <li
              className={
                readinessChecks[2]
                  ? "done"
                  : ""
              }
            >
              {locale === "ar"
                ? "منتج منشور واحد على الأقل"
                : "At least one published product"}
            </li>

            <li
              className={
                readinessChecks[3]
                  ? "done"
                  : ""
              }
            >
              {locale === "ar"
                ? "بيانات التواصل والتوصيل والسياسات"
                : "Contact, delivery & policies"}
            </li>
          </ul>

          <Link
            className="button button-dark button-block"
            href={`/${locale}/merchant/store`}
          >
            {locale === "ar"
              ? "إدارة المتجر"
              : "Manage store"}
          </Link>
        </article>
      </div>
    </>
  );
}