"use client";

import { Check, LayoutGrid, Palette, PanelTop, Sparkles, Type } from "lucide-react";
import { PersistentImage } from "@/components/ui/persistent-media";
import { storeThemePresets } from "@/lib/store-theme";
import type { Locale, Store, StoreTheme, StoreThemePreset } from "@/types";

const presetLabels: Record<StoreThemePreset, { ar: string; en: string; descriptionAr: string; descriptionEn: string }> = {
  modern: { ar: "عصري", en: "Modern", descriptionAr: "شبكة نظيفة وهوية تجارية مرنة.", descriptionEn: "Clean grid and flexible commerce identity." },
  boutique: { ar: "بوتيك", en: "Boutique", descriptionAr: "طابع تحريري دافئ للموضة والجمال.", descriptionEn: "Warm editorial style for fashion and beauty." },
  minimal: { ar: "بسيط", en: "Minimal", descriptionAr: "مساحات بيضاء وتركيز كامل على المنتج.", descriptionEn: "White space with full product focus." },
  bold: { ar: "جريء", en: "Bold", descriptionAr: "تباين قوي مناسب للتقنية والعلامات الشبابية.", descriptionEn: "High contrast for tech and youth brands." },
};

export function StoreThemeEditor({
  locale,
  store,
  value,
  onChange,
}: {
  locale: Locale;
  store?: Store;
  value: StoreTheme;
  onChange: (theme: StoreTheme) => void;
}) {
  function applyPreset(preset: StoreThemePreset) {
    onChange({ ...storeThemePresets[preset], announcement: value.announcement });
  }

  function patch<K extends keyof StoreTheme>(key: K, next: StoreTheme[K]) {
    onChange({ ...value, [key]: next });
  }

  const style = {
    "--preview-accent": value.accentColor,
    "--preview-bg": value.backgroundColor,
    "--preview-surface": value.surfaceColor,
    "--preview-text": value.textColor,
    "--preview-radius": `${value.cardRadius}px`,
  } as React.CSSProperties;

  return <section className="editor-card theme-editor-card">
    <div className="card-head">
      <div><span className="eyebrow">STORE THEME SYSTEM</span><h3>{locale === "ar" ? "الثيم المخصص للمتجر" : "Custom store theme"}</h3></div>
      <Palette />
    </div>

    <div className="theme-preset-grid">
      {(Object.keys(storeThemePresets) as StoreThemePreset[]).map((preset) => {
        const label = presetLabels[preset];
        return <button type="button" key={preset} className={`theme-preset ${value.preset === preset ? "is-active" : ""}`} onClick={() => applyPreset(preset)}>
          <span className={`theme-preset-swatch preset-${preset}`}><i /><i /><i /></span>
          <strong>{locale === "ar" ? label.ar : label.en}</strong>
          <small>{locale === "ar" ? label.descriptionAr : label.descriptionEn}</small>
          {value.preset === preset && <Check className="theme-preset-check" />}
        </button>;
      })}
    </div>

    <div className="theme-customizer-grid">
      <div className="theme-controls">
        <div className="theme-control-section">
          <div className="theme-control-title"><Palette /><div><strong>{locale === "ar" ? "الألوان" : "Colors"}</strong><small>{locale === "ar" ? "ألوان مستقلة لكل واجهة متجر." : "Independent colors for each storefront."}</small></div></div>
          <div className="theme-color-grid">
            <label><span>{locale === "ar" ? "الأساسي" : "Accent"}</span><input type="color" value={value.accentColor} onChange={(event) => patch("accentColor", event.target.value)} /></label>
            <label><span>{locale === "ar" ? "الخلفية" : "Background"}</span><input type="color" value={value.backgroundColor} onChange={(event) => patch("backgroundColor", event.target.value)} /></label>
            <label><span>{locale === "ar" ? "البطاقات" : "Surface"}</span><input type="color" value={value.surfaceColor} onChange={(event) => patch("surfaceColor", event.target.value)} /></label>
            <label><span>{locale === "ar" ? "النص" : "Text"}</span><input type="color" value={value.textColor} onChange={(event) => patch("textColor", event.target.value)} /></label>
          </div>
        </div>

        <div className="theme-control-section">
          <div className="theme-control-title"><PanelTop /><div><strong>{locale === "ar" ? "واجهة الغلاف" : "Hero style"}</strong><small>{locale === "ar" ? "اختر طريقة عرض هوية المتجر." : "Choose how the store identity is presented."}</small></div></div>
          <div className="segmented-control">
            {(["cover", "split", "minimal"] as const).map((item) => <button type="button" key={item} className={value.heroStyle === item ? "is-active" : ""} onClick={() => patch("heroStyle", item)}>{item === "cover" ? (locale === "ar" ? "غلاف" : "Cover") : item === "split" ? (locale === "ar" ? "منقسم" : "Split") : (locale === "ar" ? "بسيط" : "Minimal")}</button>)}
          </div>
        </div>

        <div className="theme-control-section">
          <div className="theme-control-title"><LayoutGrid /><div><strong>{locale === "ar" ? "تخطيط المنتجات" : "Product layout"}</strong><small>{locale === "ar" ? "شبكة عملية أو عرض تحريري واسع." : "Practical grid or editorial presentation."}</small></div></div>
          <div className="segmented-control">
            <button type="button" className={value.layout === "grid" ? "is-active" : ""} onClick={() => patch("layout", "grid")}>{locale === "ar" ? "شبكة" : "Grid"}</button>
            <button type="button" className={value.layout === "editorial" ? "is-active" : ""} onClick={() => patch("layout", "editorial")}>{locale === "ar" ? "تحريري" : "Editorial"}</button>
          </div>
        </div>

        <div className="theme-control-section">
          <div className="theme-control-title"><Type /><div><strong>{locale === "ar" ? "الخط والأزرار" : "Typography and buttons"}</strong></div></div>
          <div className="form-grid two">
            <label className="field"><span>{locale === "ar" ? "نمط الخط" : "Font style"}</span><select value={value.font} onChange={(event) => patch("font", event.target.value as StoreTheme["font"])}><option value="system">{locale === "ar" ? "مؤسسي" : "System"}</option><option value="rounded">{locale === "ar" ? "دائري" : "Rounded"}</option><option value="serif">{locale === "ar" ? "تحريري" : "Serif"}</option></select></label>
            <label className="field"><span>{locale === "ar" ? "نمط الزر" : "Button style"}</span><select value={value.buttonStyle} onChange={(event) => patch("buttonStyle", event.target.value as StoreTheme["buttonStyle"])}><option value="solid">{locale === "ar" ? "ممتلئ" : "Solid"}</option><option value="outline">{locale === "ar" ? "حدود" : "Outline"}</option><option value="pill">{locale === "ar" ? "كبسولة" : "Pill"}</option></select></label>
          </div>
          <label className="theme-range"><span>{locale === "ar" ? "استدارة البطاقات" : "Card radius"} <b>{value.cardRadius}px</b></span><input type="range" min="0" max="32" step="2" value={value.cardRadius} onChange={(event) => patch("cardRadius", Number(event.target.value))} /></label>
        </div>

        <label className="field"><span>{locale === "ar" ? "شريط إعلان المتجر" : "Store announcement bar"}</span><input value={value.announcement ?? ""} maxLength={90} onChange={(event) => patch("announcement", event.target.value)} placeholder={locale === "ar" ? "مثال: توصيل مجاني للطلبات فوق 200 شيكل" : "Example: Free delivery on orders over 200"} /></label>
      </div>

      <div className={`theme-live-preview theme-font-${value.font} theme-button-${value.buttonStyle}`} style={style}>
        <div className="theme-preview-label"><Sparkles />{locale === "ar" ? "معاينة مباشرة" : "Live preview"}</div>
        <div className={`theme-preview-store hero-${value.heroStyle}`}>
          {value.announcement && <div className="theme-preview-announcement">{value.announcement}</div>}
          <div className="theme-preview-cover"><PersistentImage src={store?.cover ?? "/assets/cover-urban.svg"} alt="" className="media-fill" optimized sizes="400px" /></div>
          <div className="theme-preview-profile">
            <div className="theme-preview-logo"><PersistentImage src={store?.logo ?? "/assets/logo.svg"} alt="" className="media-cover" optimized width={56} height={56} /></div>
            <div><small>TIJVORYA STORE</small><strong>{locale === "ar" ? store?.name ?? "متجرك" : store?.nameEn ?? "Your store"}</strong><span>{locale === "ar" ? "واجهة تعكس هوية علامتك" : "A storefront that reflects your brand"}</span></div>
            <button type="button">{locale === "ar" ? "تسوّق الآن" : "Shop now"}</button>
          </div>
          <div className={`theme-preview-products layout-${value.layout}`}>
            {[1, 2, 3].map((item) => <article key={item}><div /><strong>{locale === "ar" ? `منتج ${item}` : `Product ${item}`}</strong><span>{90 + item * 25} ₪</span></article>)}
          </div>
        </div>
      </div>
    </div>
  </section>;
}
