import { NextResponse } from "next/server";
import { getAIModel, isDemoAIAllowed, isOpenAIConfigured } from "@/lib/ai/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const configured = isOpenAIConfigured();
  const demo = isDemoAIAllowed();
  return NextResponse.json({
    enabled: process.env.AI_ENABLED !== "false",
    configured,
    mode: configured ? "live" : demo ? "demo" : "unavailable",
    provider: "OpenAI",
    model: getAIModel(),
  });
}
