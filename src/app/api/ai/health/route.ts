import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const aiEnabled =
    String(process.env.AI_ENABLED ?? "").toLowerCase() === "true";

  const openAIConfigured = Boolean(
    process.env.OPENAI_API_KEY?.trim()
  );

  return NextResponse.json(
    {
      ok: true,
      aiEnabled,
      openAIConfigured,
      mode: aiEnabled && openAIConfigured ? "live" : "disabled",
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}