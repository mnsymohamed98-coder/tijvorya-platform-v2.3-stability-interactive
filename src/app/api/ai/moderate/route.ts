import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aiErrorResponse, assertAIFeatureEnabled, enforceAIRateLimit, getOpenAIClient, isDemoAIAllowed, requireAIActor } from "@/lib/ai/server";

const inputSchema = z.object({ text: z.string().trim().min(1).max(5000), imageUrl: z.string().trim().max(2048).refine((value) => !value || /^https:\/\//i.test(value), "HTTPS image URL required").optional() });

export async function POST(request: NextRequest) {
  try {
    const actor = await requireAIActor(["merchant", "influencer", "admin"]);
    await assertAIFeatureEnabled("moderation");
    enforceAIRateLimit(`${actor.id}:moderation`);
    const input = inputSchema.parse(await request.json());
    const client = getOpenAIClient();
    if (!client) {
      if (isDemoAIAllowed()) return NextResponse.json({ flagged: false, categories: [], mode: "demo" });
      throw new Error("OPENAI_NOT_CONFIGURED");
    }
    const multimodal: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> = [{ type: "text", text: input.text }];
    if (input.imageUrl && /^https:\/\//i.test(input.imageUrl)) multimodal.push({ type: "image_url", image_url: { url: input.imageUrl } });
    const result = await client.moderations.create({ model: "omni-moderation-latest", input: multimodal });
    const first = result.results[0];
    const categories = Object.entries(first.categories).filter(([, value]) => value).map(([key]) => key);
    return NextResponse.json({ flagged: first.flagged, categories, scores: first.category_scores, mode: "live" });
  } catch (error) {
    const detail = aiErrorResponse(error);
    return NextResponse.json({ error: detail.ar, errorEn: detail.en }, { status: detail.status });
  }
}
