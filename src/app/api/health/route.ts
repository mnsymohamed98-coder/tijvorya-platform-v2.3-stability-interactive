import { NextResponse } from "next/server";

export function GET() {
  const databaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  const productionMode = databaseConfigured && process.env.NEXT_PUBLIC_DEMO_MODE !== "true";
  return NextResponse.json({
    status: "ok",
    service: "tijvorya",
    version: "2.3.0",
    time: new Date().toISOString(),
    mode: productionMode ? "production" : "local",
    dependencies: {
      databaseConfigured,
      mediaConfigured: Boolean(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME && process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET),
      aiConfigured: Boolean(process.env.OPENAI_API_KEY),
    },
  }, { headers: { "Cache-Control": "no-store" } });
}
