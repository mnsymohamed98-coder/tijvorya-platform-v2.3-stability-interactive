import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const allowedFolders = new Set(["tijvorya/products", "tijvorya/reels", "tijvorya/stores"]);

function json(body: object, status: number) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  try {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) return json({ error: "Cloudinary is not configured." }, 503);

    if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") {
      const supabase = await createClient();
      if (!supabase) return json({ error: "Unauthorized" }, 401);
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) return json({ error: "Unauthorized" }, 401);
      const { data: profile } = await supabase.from("profiles").select("role,status").eq("id", authData.user.id).maybeSingle();
      if (!profile || profile.status === "suspended" || !["merchant", "influencer", "admin"].includes(String(profile.role))) {
        return json({ error: "Forbidden" }, 403);
      }
    }

    const body = await request.json() as { resourceType?: string; folder?: string };
    const resourceType = body.resourceType === "video" ? "video" : "image";
    const folder = allowedFolders.has(body.folder ?? "") ? body.folder! : "tijvorya/products";
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, apiSecret);
    return json({ cloudName, apiKey, timestamp, signature, folder, resourceType }, 200);
  } catch {
    return json({ error: "Unable to sign upload." }, 400);
  }
}
