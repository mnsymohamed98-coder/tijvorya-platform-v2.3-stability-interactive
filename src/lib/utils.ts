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

// Supabase/PostgREST errors are plain objects with a `message` string, not
// `Error` instances, so `error instanceof Error` misses them and callers
// fall back to a generic message that hides the real reason (e.g. an RLS
// policy rejection). This reads `.message` off anything error-shaped.
export function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error && typeof (error as { message?: unknown }).message === "string") {
    return (error as { message: string }).message;
  }
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
}
