import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowUpLeft, Globe2, MapPin } from "lucide-react";
import { PersistentImage } from "@/components/ui/persistent-media";
import { normalizeStoreTheme } from "@/lib/store-theme";
import type { Locale, Store } from "@/types";
import { businessCategoryLabel, merchantDisplayDomain, merchantStoreHref } from "@/lib/store-website";

export function StoreCard({ store, locale }: { store: Store; locale: Locale }) {
  const storeName = locale === "ar" ? store.name : store.nameEn;
  const businessCategory = businessCategoryLabel(store.website?.businessCategory || "general", locale);
  const domain = merchantDisplayDomain(store.slug, locale);
  const isReady = store.website?.onboardingCompleted === true;
  const theme = normalizeStoreTheme(store.theme, store.themeColor);

  return <Link className="store-card store-card-logo" href={merchantStoreHref(store.slug, locale)} aria-label={locale === "ar" ? `زيارة متجر ${storeName}` : `Visit ${storeName}`} style={{ "--store-accent": theme.accentColor } as CSSProperties}>
    <div className="store-card-top">
      <div className="store-card-icon-shell">
        <div className="store-logo store-logo-large">
          <PersistentImage className="media-cover" src={store.logo} alt={locale === "ar" ? `شعار ${storeName}` : `${storeName} logo`} optimized width={68} height={68} />
        </div>
        {store.verified && <span className="store-verified-badge" title={locale === "ar" ? "متجر موثّق" : "Verified store"}>✓</span>}
      </div>
      {isReady && <span className="store-ready-pill">{locale === "ar" ? "جاهز" : "Ready"}</span>}
    </div>

    <div className="store-card-copy">
      <h3>{storeName}</h3>
      <p className="store-card-domain"><Globe2 size={14} />{domain}</p>

      <div className="store-meta store-meta-compact">
        <span>{businessCategory}</span>
        {store.city && <span><MapPin size={14} />{store.city}</span>}
      </div>
    </div>

    <span className="store-card-cta">{locale === "ar" ? "زيارة المتجر" : "Visit store"}<ArrowUpLeft size={15} /></span>
  </Link>;
}
