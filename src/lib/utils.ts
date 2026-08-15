export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function uid(prefix = "id") {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && "randomUUID" in cryptoApi) return `${prefix}_${cryptoApi.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const configuredCurrency = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY?.trim().toUpperCase();
const DEFAULT_CURRENCY = configuredCurrency && /^[A-Z]{3}$/.test(configuredCurrency) ? configuredCurrency : "ILS";

export function formatMoney(value: number, locale: "ar" | "en" = "ar", currency = DEFAULT_CURRENCY) {
  try {
    return new Intl.NumberFormat(locale === "ar" ? "ar-PS" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${Number(value).toFixed(2)} ${DEFAULT_CURRENCY}`;
  }
}

export function formatCompact(value: number, locale: "ar" | "en" = "ar") {
  return new Intl.NumberFormat(locale === "ar" ? "ar" : "en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "") || `store-${Date.now()}`;
}

export function safeNumber(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function safeInternalPath(value: string | null | undefined, fallback = "/") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}
