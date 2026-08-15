import OpenAI from "openai";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

export type AIActor = {
  id: string;
  role: "admin" | "merchant" | "influencer" | "customer";
  demo: boolean;
};

export type AIFeature = "product_writer" | "reel_writer" | "moderation" | "reel_review";

const buckets = new Map<string, { count: number; resetAt: number }>();
let lastBucketCleanup = 0;

export function isOpenAIConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function getAIModel() {
  return process.env.OPENAI_MODEL?.trim() || "gpt-5-mini";
}

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  return apiKey ? new OpenAI({ apiKey, timeout: 30_000, maxRetries: 2 }) : null;
}

export function isDemoAIAllowed() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

export async function requireAIActor(allowedRoles: AIActor["role"][]): Promise<AIActor> {
  if (isDemoAIAllowed()) return { id: "local-ai-actor", role: allowedRoles[0] ?? "merchant", demo: true };

  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("UNAUTHORIZED");
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) throw new Error("UNAUTHORIZED");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,status")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (!profile || profile.status === "suspended") throw new Error("FORBIDDEN");
  const role = profile.role as AIActor["role"];
  if (!allowedRoles.includes(role)) throw new Error("FORBIDDEN");
  return { id: authData.user.id, role, demo: false };
}

export async function assertAIFeatureEnabled(feature: AIFeature) {
  if (process.env.AI_ENABLED === "false") throw new Error("AI_DISABLED");
  if (isDemoAIAllowed()) return;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return;
  const { data } = await supabase
    .from("platform_settings")
    .select("ai_enabled,ai_product_writer_enabled,ai_reel_writer_enabled,ai_moderation_enabled")
    .eq("id", "main")
    .maybeSingle();

  if (data?.ai_enabled === false) throw new Error("AI_DISABLED");
  if (feature === "product_writer" && data?.ai_product_writer_enabled === false) throw new Error("AI_FEATURE_DISABLED");
  if (feature === "reel_writer" && data?.ai_reel_writer_enabled === false) throw new Error("AI_FEATURE_DISABLED");
  if ((feature === "moderation" || feature === "reel_review") && data?.ai_moderation_enabled === false) throw new Error("AI_FEATURE_DISABLED");
}

export function enforceAIRateLimit(key: string) {
  const now = Date.now();
  if (now - lastBucketCleanup > 10 * 60 * 1000) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }
    lastBucketCleanup = now;
  }
  const windowMs = 10 * 60 * 1000;
  const configured = Number.parseInt(process.env.AI_RATE_LIMIT_PER_10_MIN ?? "20", 10);
  const limit = Number.isFinite(configured) && configured > 0 ? Math.min(configured, 200) : 20;
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  if (current.count >= limit) throw new Error("RATE_LIMITED");
  current.count += 1;
}

export function aiErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "AI_ERROR";
  const table: Record<string, { status: number; ar: string; en: string }> = {
    UNAUTHORIZED: { status: 401, ar: "يجب تسجيل الدخول لاستخدام أدوات الذكاء الاصطناعي.", en: "Sign in to use AI tools." },
    FORBIDDEN: { status: 403, ar: "لا تملك صلاحية استخدام هذه الأداة.", en: "You are not allowed to use this tool." },
    AI_DISABLED: { status: 503, ar: "الذكاء الاصطناعي متوقف من إعدادات المنصة.", en: "AI is disabled in platform settings." },
    AI_FEATURE_DISABLED: { status: 503, ar: "هذه الميزة الذكية متوقفة من إعدادات المنصة.", en: "This AI feature is disabled." },
    RATE_LIMITED: { status: 429, ar: "تم بلوغ حد الاستخدام المؤقت. حاول بعد عدة دقائق.", en: "Temporary AI usage limit reached. Try again later." },
    OPENAI_NOT_CONFIGURED: { status: 503, ar: "مفتاح OpenAI غير مضاف إلى إعدادات الخادم.", en: "The OpenAI API key is not configured." },
    INVALID_INPUT: { status: 400, ar: "البيانات المدخلة غير صالحة. راجع الحقول وحاول مجددًا.", en: "Invalid input. Review the fields and try again." },
  };
  if (error && typeof error === "object" && "name" in error && error.name === "ZodError") return table.INVALID_INPUT;
  if (error instanceof SyntaxError) return table.INVALID_INPUT;
  const known = table[message];
  return known ?? { status: 500, ar: "تعذر تنفيذ الطلب الذكي حاليًا.", en: "The AI request could not be completed." };
}
