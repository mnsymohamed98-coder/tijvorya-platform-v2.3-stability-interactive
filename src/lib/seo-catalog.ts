import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { absoluteUrl } from "@/lib/site";
import type { StoreWebsiteProfile } from "@/types";

export type PublicProductSeo = {
  id: string;
  storeId: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  image: string;
  price: number;
  stock: number;
  storeName: string;
  storeNameEn: string;
};

export type PublicStoreSeo = {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  logo: string;
  cover: string;
  city: string;
  rating: number;
  verified: boolean;
  phone?: string;
  website?: Partial<StoreWebsiteProfile>;
};

function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || process.env.NEXT_PUBLIC_DEMO_MODE === "true") return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export const getPublicProductSeo = cache(async (id: string): Promise<PublicProductSeo | null> => {
  const supabase = publicClient();
  if (!supabase) return null;
  const { data: product, error } = await supabase.from("products")
    .select("id,store_id,name,name_en,description,description_en,image_url,price,stock,status")
    .eq("id", id).eq("status", "active").maybeSingle();
  if (error || !product) return null;
  const { data: store } = await supabase.from("stores")
    .select("id,name,name_en,status").eq("id", product.store_id).eq("status", "active").maybeSingle();
  if (!store) return null;
  return {
    id: String(product.id), storeId: String(product.store_id), name: String(product.name), nameEn: String(product.name_en ?? product.name),
    description: String(product.description ?? ""), descriptionEn: String(product.description_en ?? product.description ?? ""),
    image: seoImage(String(product.image_url ?? "/assets/logo.svg")), price: Number(product.price ?? 0), stock: Number(product.stock ?? 0),
    storeName: String(store.name), storeNameEn: String(store.name_en ?? store.name),
  };
});

export const getPublicStoreSeo = cache(async (slug: string): Promise<PublicStoreSeo | null> => {
  const supabase = publicClient();
  if (!supabase) return null;
  const { data: store, error } = await supabase.from("stores")
    .select("id,slug,name,name_en,description,description_en,logo_url,cover_url,city,rating,status,verified,phone,website")
    .eq("slug", slug).eq("status", "active").maybeSingle();
  if (error || !store) return null;
  return {
    id: String(store.id), slug: String(store.slug), name: String(store.name), nameEn: String(store.name_en ?? store.name),
    description: String(store.description ?? ""), descriptionEn: String(store.description_en ?? store.description ?? ""),
    logo: seoImage(String(store.logo_url ?? "/assets/logo.svg")), cover: seoImage(String(store.cover_url ?? store.logo_url ?? "/assets/logo.svg")),
    city: String(store.city ?? ""), rating: Number(store.rating ?? 0), verified: Boolean(store.verified),
    phone: store.phone ? String(store.phone) : undefined,
    website: store.website && typeof store.website === "object" ? (store.website as Partial<StoreWebsiteProfile>) : undefined,
  };
});

export async function getPublicSitemapRecords() {
  const supabase = publicClient();
  if (!supabase) return { products: [] as Array<{ id: string; created_at?: string }>, stores: [] as Array<{ slug: string; created_at?: string }> };
  const [products, stores] = await Promise.all([
    supabase.from("products").select("id,created_at").eq("status", "active").order("created_at", { ascending: false }).limit(15_000),
    supabase.from("stores").select("slug,created_at").eq("status", "active").order("created_at", { ascending: false }).limit(5_000),
  ]);
  return {
    products: (products.data ?? []).map((row) => ({ id: String(row.id), created_at: row.created_at ? String(row.created_at) : undefined })),
    stores: (stores.data ?? []).map((row) => ({ slug: String(row.slug), created_at: row.created_at ? String(row.created_at) : undefined })),
  };
}

export function seoImage(value: string) {
  if (value.startsWith("/")) return absoluteUrl(value);
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : absoluteUrl("/assets/logo.svg");
  } catch {
    return absoluteUrl("/assets/logo.svg");
  }
}

export function shortDescription(value: string, fallback: string) {
  const clean = value.replace(/\s+/g, " ").trim() || fallback;
  return clean.length > 160 ? `${clean.slice(0, 157).trim()}…` : clean;
}
