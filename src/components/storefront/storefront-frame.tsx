"use client";

import Link from "next/link";
import {
  Globe2,
  Grid2X2,
  Home,
  Info,
  Mail,
  MapPin,
  MessageCircle,
  Music2,
  Phone,
  Share2,
  ShoppingBag,
  ShieldCheck,
} from "lucide-react";

import {
  FacebookBrandIcon,
  InstagramBrandIcon,
} from "@/components/ui/social-brand-icons";

import { PersistentImage } from "@/components/ui/persistent-media";
import { normalizeStoreTheme } from "@/lib/store-theme";
import {
  merchantDomain,
  merchantStoreHref,
  normalizeStoreWebsiteProfile,
  safeExternalUrl,
} from "@/lib/store-website";
import { useApp } from "@/providers/app-provider";
import type { Store } from "@/types";

export type StorefrontPage =
  | "home"
  | "products"
  | "about";

function phoneHref(value?: string) {
  const clean = value?.replace(/[^+\d]/g, "");
  return clean ? `tel:${clean}` : undefined;
}

function whatsappHref(value?: string) {
  const clean = value?.replace(/\D/g, "");
  return clean
    ? `https://wa.me/${clean}`
    : undefined;
}

export function StorefrontFrame({
  store,
  active,
  children,
}: {
  store: Store;
  active: StorefrontPage;
  children: React.ReactNode;
}) {
  const {
    locale,
    cart,
    platformSettings,
    toast,
  } = useApp();

  const theme = normalizeStoreTheme(
    store.theme,
    store.themeColor
  );

  const website =
    normalizeStoreWebsiteProfile(
      store.website
    );

  const base = merchantStoreHref(
    store.slug,
    locale,
    "home"
  );

  const productsHref =
    merchantStoreHref(
      store.slug,
      locale,
      "products"
    );

  const aboutHref =
    merchantStoreHref(
      store.slug,
      locale,
      "about"
    );

  const cartCount = cart.reduce(
    (sum, item) =>
      sum + item.quantity,
    0
  );

  const name =
    locale === "ar"
      ? store.name
      : store.nameEn || store.name;

  const domain =
    website.domain ||
    merchantDomain(store.slug);

  const socialLinks = [
    {
      key: "instagram",
      href: safeExternalUrl(
        website.instagram
      ),
      label: "Instagram",
      Icon: InstagramBrandIcon,
    },
    {
      key: "facebook",
      href: safeExternalUrl(
        website.facebook
      ),
      label: "Facebook",
      Icon: FacebookBrandIcon,
    },
    {
      key: "tiktok",
      href: safeExternalUrl(
        website.tiktok
      ),
      label: "TikTok",
      Icon: Music2,
    },
  ].filter((item) =>
    Boolean(item.href)
  );

  const style = {
    "--store-accent":
      theme.accentColor,
    "--store-bg":
      theme.backgroundColor,
    "--store-surface":
      theme.surfaceColor,
    "--store-text":
      theme.textColor,
    "--store-radius":
      `${theme.cardRadius}px`,
  } as React.CSSProperties;

  const pageHref = (
    page: StorefrontPage,
    nextLocale = locale
  ) =>
    merchantStoreHref(
      store.slug,
      nextLocale,
      page
    );

  async function shareStore() {
    const relativeUrl =
      merchantStoreHref(
        store.slug,
        locale,
        "home"
      );

    const storeUrl =
      typeof window !== "undefined"
        ? new URL(
            relativeUrl,
            window.location.origin
          ).toString()
        : relativeUrl;

    try {
      if (
        typeof navigator !==
          "undefined" &&
        navigator.share
      ) {
        await navigator.share({
          title: `${name} | Tijvorya`,
          text:
            locale === "ar"
              ? `اكتشف متجر ${name} على Tijvorya`
              : `Discover ${name} on Tijvorya`,
          url: storeUrl,
        });

        return;
      }

      if (
        typeof navigator !==
          "undefined" &&
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
        error instanceof
          DOMException &&
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
    <div
      className={`merchant-website themed-storefront theme-preset-${theme.preset} theme-font-${theme.font} theme-button-${theme.buttonStyle} layout-${theme.layout}`}
      style={style}
    >
      <a
        className="skip-link"
        href="#merchant-site-main"
      >
        {locale === "ar"
          ? "انتقل إلى محتوى المتجر"
          : "Skip to store content"}
      </a>

      {theme.announcement && (
        <div className="merchant-site-announcement">
          {theme.announcement}
        </div>
      )}

      <div className="merchant-site-identity-strip">
        <div className="merchant-site-shell">
          <span>
            <ShieldCheck />
            {locale === "ar"
              ? "الموقع الرسمي للمتجر"
              : "Official merchant storefront"}
          </span>

          <span className="merchant-domain-label">
            <Globe2 />
            {domain}
          </span>

          {store.city && (
            <span>
              <MapPin />
              {store.city}
            </span>
          )}
        </div>
      </div>

      <header className="merchant-site-header">
        <div className="merchant-site-shell merchant-site-header-inner">
          <Link
            className="merchant-site-brand"
            href={base}
            aria-label={name}
          >
            <span className="merchant-site-brand-logo">
              <PersistentImage
                className="media-cover"
                src={store.logo}
                alt={name}
              />
            </span>

            <span>
              <strong>{name}</strong>
              <small>{domain}</small>
            </span>
          </Link>

          <nav
            className="merchant-site-nav"
            aria-label={
              locale === "ar"
                ? "تنقل المتجر"
                : "Store navigation"
            }
          >
            <Link
              className={
                active === "home"
                  ? "is-active"
                  : ""
              }
              href={base}
            >
              <Home />
              {locale === "ar"
                ? "الرئيسية"
                : "Home"}
            </Link>

            <Link
              className={
                active ===
                "products"
                  ? "is-active"
                  : ""
              }
              href={productsHref}
            >
              <Grid2X2 />
              {locale === "ar"
                ? "المنتجات"
                : "Products"}
            </Link>

            <Link
              className={
                active === "about"
                  ? "is-active"
                  : ""
              }
              href={aboutHref}
            >
              <Info />
              {locale === "ar"
                ? "عن المتجر"
                : "About"}
            </Link>
          </nav>

          <div className="merchant-site-actions">
            <button
              type="button"
              className="merchant-site-icon-link"
              onClick={() =>
                void shareStore()
              }
              aria-label={
                locale === "ar"
                  ? "مشاركة المتجر"
                  : "Share store"
              }
              title={
                locale === "ar"
                  ? "مشاركة المتجر"
                  : "Share store"
              }
            >
              <Share2 />
            </button>

            {platformSettings.messagingEnabled && (
              <Link
                className="merchant-site-icon-link"
                href={`/${locale}/messages?store=${encodeURIComponent(
                  store.slug
                )}`}
                aria-label={
                  locale === "ar"
                    ? "مراسلة المتجر"
                    : "Message store"
                }
              >
                <MessageCircle />
              </Link>
            )}

            <Link
              className="merchant-site-icon-link"
              href={`/${locale}/cart`}
              aria-label={
                locale === "ar"
                  ? "سلة التسوق"
                  : "Shopping cart"
              }
            >
              <ShoppingBag />

              {cartCount > 0 && (
                <b>
                  {cartCount > 99
                    ? "99+"
                    : cartCount}
                </b>
              )}
            </Link>

            <Link
              className="merchant-site-locale"
              href={pageHref(
                active,
                locale === "ar"
                  ? "en"
                  : "ar"
              )}
            >
              {locale === "ar"
                ? "EN"
                : "ع"}
            </Link>
          </div>
        </div>
      </header>

      <main id="merchant-site-main">
        {children}
      </main>

      <footer className="merchant-site-footer">
        <div className="merchant-site-shell merchant-site-footer-grid">
          <div className="merchant-site-footer-brand">
            <Link
              className="merchant-site-brand"
              href={base}
            >
              <span className="merchant-site-brand-logo">
                <PersistentImage
                  className="media-cover"
                  src={store.logo}
                  alt={name}
                />
              </span>

              <span>
                <strong>
                  {name}
                </strong>
                <small>
                  {domain}
                </small>
              </span>
            </Link>

            <p>
              {locale === "ar"
                ? store.description
                : store.descriptionEn}
            </p>

            {(website.legalName ||
              website.registrationNumber) && (
              <div className="merchant-legal-identity">
                {website.legalName && (
                  <span>
                    {locale === "ar"
                      ? "الاسم القانوني:"
                      : "Legal name:"}{" "}
                    <strong>
                      {website.legalName}
                    </strong>
                  </span>
                )}

                {website.registrationNumber && (
                  <span>
                    {locale === "ar"
                      ? "رقم التسجيل:"
                      : "Registration:"}{" "}
                    <strong>
                      {
                        website.registrationNumber
                      }
                    </strong>
                  </span>
                )}
              </div>
            )}

            {socialLinks.length > 0 && (
              <div className="merchant-site-socials">
                {socialLinks.map(
                  ({
                    key,
                    href,
                    label,
                    Icon,
                  }) => (
                    <a
                      key={key}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={
                        label
                      }
                    >
                      <Icon />
                    </a>
                  )
                )}
              </div>
            )}
          </div>

          <div>
            <strong>
              {locale === "ar"
                ? "تصفح"
                : "Explore"}
            </strong>

            <Link href={base}>
              {locale === "ar"
                ? "الرئيسية"
                : "Home"}
            </Link>

            <Link
              href={productsHref}
            >
              {locale === "ar"
                ? "جميع المنتجات"
                : "All products"}
            </Link>

            <Link href={aboutHref}>
              {locale === "ar"
                ? "عن المتجر"
                : "About the store"}
            </Link>
          </div>

          <div>
            <strong>
              {locale === "ar"
                ? "تواصل معنا"
                : "Contact"}
            </strong>

            {website.businessEmail && (
              <a
                href={`mailto:${website.businessEmail}`}
              >
                <Mail />
                {
                  website.businessEmail
                }
              </a>
            )}

            {store.phone && (
              <a
                href={phoneHref(
                  store.phone
                )}
              >
                <Phone />
                {store.phone}
              </a>
            )}

            {website.address && (
              <span>
                <MapPin />
                {website.address}
              </span>
            )}

            {store.whatsapp && (
              <a
                href={whatsappHref(
                  store.whatsapp
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle />
                WhatsApp
              </a>
            )}
          </div>
        </div>

        <div className="merchant-site-shell merchant-site-footer-bottom">
          <span>
            © {new Date().getFullYear()}{" "}
            {name}
          </span>

          <span>
            {locale === "ar"
              ? "واجهة التجارة والبنية التقنية بواسطة"
              : "Commerce infrastructure by"}{" "}
            <Link href={`/${locale}`}>
              Tijvorya
            </Link>
          </span>
        </div>
      </footer>
    </div>
  );
}