import Link from "next/link";
import { ArrowUpLeft, Globe2, MapPin } from "lucide-react";
import { PersistentImage } from "@/components/ui/persistent-media";
import type { Locale, Store } from "@/types";
import { businessCategoryLabel, merchantDomain, merchantStoreHref } from "@/lib/store-website";

export function StoreCard({ store, locale }: { store: Store; locale: Locale }) {
  const storeName = locale === "ar" ? store.name : store.nameEn;
  const businessCategory = businessCategoryLabel(store.website?.businessCategory || "general", locale);
  const domain = store.website?.domain?.trim() || merchantDomain(store.slug);
  const isReady = store.website?.onboardingCompleted === true;

  return <Link className="store-card store-card-logo" href={merchantStoreHref(store.slug, locale)} aria-label={locale === "ar" ? `زيارة متجر ${storeName}` : `Visit ${storeName}`}>
    <div className="store-card-icon-shell">
      <div className="store-logo store-logo-large">
        <PersistentImage className="media-cover" src={store.logo} alt={locale === "ar" ? `شعار ${storeName}` : `${storeName} logo`} />
      </div>
      {store.verified && <span className="store-verified-badge" title={locale === "ar" ? "متجر موثّق" : "Verified store"}>✓</span>}
    </div>

    <div className="store-card-copy">
      <div className="store-card-topline">
        <h3>{storeName}</h3>
        {isReady && <span className="store-ready-pill">{locale === "ar" ? "جاهز" : "Ready"}</span>}
      </div>

      <p className="store-card-domain"><Globe2 size={14} />{domain}</p>

      <div className="store-meta store-meta-compact">
        <span>{businessCategory}</span>
        {store.city && <span><MapPin size={14} />{store.city}</span>}
      </div>
    </div>

    <span className="store-card-cta">{locale === "ar" ? "زيارة" : "Visit"}<ArrowUpLeft size={15} /></span>
  </Link>;
}
