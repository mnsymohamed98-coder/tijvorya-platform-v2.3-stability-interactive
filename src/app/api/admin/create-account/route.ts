import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient as createSessionClient } from "@/lib/supabase/server";

const inputSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(30).optional(),
  role: z.enum(["merchant", "influencer"]).default("merchant"),
});

function json(body: object, status: number) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

// Merchant self-registration is off by default (platformSettings.merchantRegistrationEnabled)
// - this is the replacement path: only a super admin can call it, and it
// provisions the account directly via the Supabase service role instead of
// the normal signUp() flow, since that flow requires the account holder to
// set their own password interactively.
function generateTempPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  let value = "";
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  for (const byte of bytes) value += alphabet[byte % alphabet.length];
  return value;
}

export async function POST(request: NextRequest) {
  try {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
      return json({ error: "Not available in demo mode." }, 503);
    }

    const sessionClient = await createSessionClient();
    if (!sessionClient) return json({ error: "Unauthorized" }, 401);
    const { data: authData, error: authError } = await sessionClient.auth.getUser();
    if (authError || !authData.user) return json({ error: "Unauthorized" }, 401);
    const { data: callerProfile } = await sessionClient.from("profiles").select("role,admin_role").eq("id", authData.user.id).maybeSingle();
    if (!callerProfile || callerProfile.role !== "admin" || callerProfile.admin_role !== "super_admin") {
      return json({ error: "Forbidden" }, 403);
    }

    const input = inputSchema.parse(await request.json());

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRoleKey) return json({ error: "Account provisioning is not configured." }, 503);

    const adminClient = createServiceClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { "X-Client-Info": "tijvorya-admin-create-account/1.0" } },
    });

    const tempPassword = generateTempPassword();
    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email: input.email.toLowerCase(),
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: input.fullName, phone: input.phone ?? "", role: input.role },
    });

    if (createError || !created.user) {
      const message = createError?.message?.toLowerCase().includes("already") ? "Email already registered." : "Unable to create the account.";
      return json({ error: message }, 400);
    }

    return json({
      ok: true,
      userId: created.user.id,
      email: input.email.toLowerCase(),
      tempPassword,
    }, 201);
  } catch (error) {
    console.error("ADMIN_CREATE_ACCOUNT_ERROR", error);
    if (error instanceof z.ZodError) return json({ error: "Invalid account details." }, 400);
    return json({ error: "Unable to create the account." }, 500);
  }
}
