import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeInternalPath } from "@/lib/utils";
import type { UserRole } from "@/types";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") === "en" ? "en" : "ar";
  const code = url.searchParams.get("code");
  const requestedRole = url.searchParams.get("role");
  const isAdminFlow = url.searchParams.get("admin") === "1";
  const requestedNext = safeInternalPath(url.searchParams.get("next"), isAdminFlow ? `/${locale}/admin` : `/${locale}/marketplace`);
  const supabase = await createClient();

  if (!code || !supabase) {
    return NextResponse.redirect(new URL(`/${locale}/login?error=oauth`, url.origin));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL(`/${locale}/login?error=oauth`, url.origin));

  if (requestedRole === "merchant" || requestedRole === "customer") {
    const { error: onboardingError } = await supabase.rpc("complete_onboarding_role", { target_role: requestedRole });
    if (onboardingError) return NextResponse.redirect(new URL(`/${locale}/login?error=onboarding`, url.origin));
  }

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.redirect(new URL(`/${locale}/login?error=session`, url.origin));

  const { data: profile } = await supabase.from("profiles").select("role,admin_role,status").eq("id", userData.user.id).maybeSingle();
  if (profile?.status === "suspended") {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL(`/${locale}/login?error=suspended`, url.origin));
  }

  const role = String(profile?.role ?? "customer") as UserRole;
  const hasAdminAccess = role === "admin" && Boolean(profile?.admin_role);
  const fallback = hasAdminAccess ? `/${locale}/admin` : role === "merchant" || role === "influencer" ? `/${locale}/merchant` : `/${locale}/marketplace`;
  const destination = isAdminFlow && !hasAdminAccess
    ? `/${locale}/admin-access?error=${role === "admin" ? "role-unassigned" : "forbidden"}`
    : safeInternalPath(requestedNext, fallback);
  return NextResponse.redirect(new URL(destination, url.origin));
}
