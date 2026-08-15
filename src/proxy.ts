import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const RESERVED_HOSTS = new Set(["www", "app", "admin", "api", "auth", "dashboard", "mail", "support", "help", "cdn", "static", "assets"]);

function storefrontRewrite(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_STOREFRONT_SUBDOMAINS !== "true") return null;
  const rootDomain = (process.env.NEXT_PUBLIC_STOREFRONT_ROOT_DOMAIN?.trim().toLowerCase() || "tijvorya.com").replace(/^\.+/, "");
  const hostname = request.nextUrl.hostname.toLowerCase();
  const suffix = `.${rootDomain}`;
  if (!hostname.endsWith(suffix)) return null;

  const subdomain = hostname.slice(0, -suffix.length);
  if (!subdomain || subdomain.includes(".") || RESERVED_HOSTS.has(subdomain)) return null;
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(subdomain)) return null;

  const path = request.nextUrl.pathname.replace(/\/+$/, "") || "/";
  let locale: "ar" | "en" = "ar";
  let page: "" | "/products" | "/about" | null = null;

  if (path === "/") page = "";
  else if (path === "/products") page = "/products";
  else if (path === "/about") page = "/about";
  else if (path === "/ar") page = "";
  else if (path === "/ar/products") page = "/products";
  else if (path === "/ar/about") page = "/about";
  else if (path === "/en") { locale = "en"; page = ""; }
  else if (path === "/en/products") { locale = "en"; page = "/products"; }
  else if (path === "/en/about") { locale = "en"; page = "/about"; }

  if (page === null) return null;
  const target = request.nextUrl.clone();
  target.pathname = `/${locale}/store/${encodeURIComponent(subdomain)}${page}`;
  return NextResponse.rewrite(target);
}

export async function proxy(request: NextRequest) {
  const storefront = storefrontRewrite(request);
  if (storefront) return storefront;
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)"],
};
