import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const MAX_BODY_BYTES = 12_000;
const WINDOW_MS = 15 * 60 * 1000;

const inputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  inquiryType: z.enum([
    "merchant",
    "partnership",
    "support",
    "press",
    "other",
  ]),
  message: z.string().trim().min(10).max(4000),
  locale: z.enum(["ar", "en"]).default("ar"),
  company: z.string().max(0).optional(),
});

const buckets = new Map<
  string,
  { count: number; resetAt: number }
>();

function configuredLimit() {
  const value = Number.parseInt(
    process.env.CONTACT_RATE_LIMIT_PER_15_MIN ?? "5",
    10
  );

  return Number.isFinite(value) && value > 0
    ? Math.min(value, 50)
    : 5;
}

function enforceRateLimit(key: string) {
  const now = Date.now();

  if (buckets.size > 5_000) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) {
        buckets.delete(bucketKey);
      }
    }
  }

  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });

    return;
  }

  if (current.count >= configuredLimit()) {
    throw new Error("RATE_LIMITED");
  }

  current.count += 1;
}

function json(body: object, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const contentLength = Number(
      request.headers.get("content-length") ?? 0
    );

    if (contentLength > MAX_BODY_BYTES) {
      return json(
        { error: "Request is too large." },
        413
      );
    }

    const ip =
      request.headers
        .get("x-forwarded-for")
        ?.split(",")[0]
        ?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    enforceRateLimit(ip);

    const input = inputSchema.parse(
      await request.json()
    );

    if (
      process.env.NEXT_PUBLIC_DEMO_MODE ===
      "true"
    ) {
      return json(
        {
          ok: true,
          mode: "demo",
        },
        201
      );
    }

    const url =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
      return json(
        {
          error:
            "Contact service is not configured.",
        },
        503
      );
    }

    const supabase = createClient(
      url,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          headers: {
            "X-Client-Info":
              "tijvorya-contact-api/2.0",
          },
        },
      }
    );

    const { error } = await supabase
      .from("contact_requests")
      .insert({
        name: input.name,
        email: input.email.toLowerCase(),
        inquiry_type: input.inquiryType,
        message: input.message,
        locale: input.locale,
        status: "new",
      });

    if (error) {
      throw error;
    }

    return json(
      {
        ok: true,
        mode: "live",
      },
      201
    );
  } catch (error) {
    console.error(
      "CONTACT_API_ERROR",
      error
    );

    if (
      error instanceof Error &&
      error.message === "RATE_LIMITED"
    ) {
      return json(
        {
          error: "Too many requests.",
        },
        429
      );
    }

    if (error instanceof z.ZodError) {
      return json(
        {
          error: "Invalid contact request.",
        },
        400
      );
    }

    return json(
      {
        error:
          "Unable to submit contact request.",
      },
      500
    );
  }
}