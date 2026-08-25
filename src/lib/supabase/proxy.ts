import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { AdminRole, UserRole } from "@/types";

const adminAccess: Record<AdminRole, readonly string[]> = {
  super_admin: ["", "reels", "stores", "products", "orders", "users", "messages", "reports", "ai", "audit", "settings"],
  content_moderator: ["", "reels", "products", "reports", "ai", "audit"],
  store_manager: ["", "stores", "products", "orders", "reports", "audit"],
  customer_support: ["", "orders", "users", "messages", "reports", "audit"],
  finance_manager: ["", "orders", "reports", "audit"],
};

function decodeSegment(value: string) {
  try { return decodeURIComponent(value); } catch { return value; }
}

function copyCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
  return target;
}

function redirectWithCookies(request: NextRequest, response: NextResponse, destination: string) {
  return copyCookies(response, NextResponse.redirect(new URL(destination, request.url)));
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Compatibility redirects prevent old or malformed merchant preview links from landing on 404.
  const merchantPreview = pathname.match(/^\/(ar|en)\/merchant\/store\/([^/]+)\/?$/);
  if (merchantPreview) {
    return NextResponse.redirect(new URL(`/${merchantPreview[1]}/store/${encodeURIComponent(decodeSegment(merchantPreview[2]))}`, request.url));
  }
  const localeLessStore = pathname.match(/^\/store\/([^/]+)\/?$/);
  if (localeLessStore) {
    return NextResponse.redirect(new URL(`/ar/store/${encodeURIComponent(decodeSegment(localeLessStore[1]))}`, request.url));
  }
  if (pathname === "/merchant" || pathname.startsWith("/merchant/")) {
    return NextResponse.redirect(new URL(`/ar${pathname}`, request.url));
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = typeof claimsData?.claims?.sub === "string" ? claimsData.claims.sub : null;
  const localeMatch = pathname.match(/^\/(ar|en)(?:\/|$)/);
  const locale = localeMatch?.[1] ?? "ar";
  const adminMatch = pathname.match(/^\/(ar|en)\/admin(?:\/|$)/);
  const merchantMatch = pathname.match(/^\/(ar|en)\/merchant(?:\/|$)/);
  const privateAccountMatch = pathname.match(/^\/(ar|en)\/(account|messages|reset-password)(?:\/|$)/);

  if (!adminMatch && !merchantMatch && !privateAccountMatch) return response;

  if (!userId) {
    const loginPath = adminMatch ? `/${locale}/admin-access` : `/${locale}/login?next=${encodeURIComponent(pathname)}`;
    return redirectWithCookies(request, response, loginPath);
  }

  const { data: profileData } = await supabase.from("profiles").select("role,status,admin_role").eq("id", userId).maybeSingle();
  const profile = (profileData ?? {}) as Record<string, unknown>;
  const role = String(profile.role ?? "customer") as UserRole;
  if (profile.status === "suspended") {
    return redirectWithCookies(request, response, `/${locale}/login?error=suspended`);
  }

  if (adminMatch) {
    if (role !== "admin") return redirectWithCookies(request, response, `/${locale}/admin-access?error=forbidden`);
    const section = pathname.split("/").filter(Boolean)[2] ?? "";
    const adminRole = (profile.admin_role as AdminRole | null) ?? "super_admin";
    const allowed = adminAccess[adminRole] ?? adminAccess.super_admin;
    if (!allowed.includes(section)) return redirectWithCookies(request, response, `/${locale}/admin`);
  }

  if (merchantMatch && role !== "merchant" && role !== "influencer") {
    return redirectWithCookies(request, response, `/${locale}/marketplace`);
  }

  return response;
}
