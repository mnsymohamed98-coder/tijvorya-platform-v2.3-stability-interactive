import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import { aiErrorResponse, assertAIFeatureEnabled, enforceAIRateLimit, getAIModel, getOpenAIClient, isDemoAIAllowed, requireAIActor } from "@/lib/ai/server";

const inputSchema = z.object({
  productName: z.string().trim().min(1).max(150),
  productDescription: z.string().trim().max(2000).default(""),
  caption: z.string().trim().max(1000),
  storeStatus: z.string().trim().max(50).default("active"),
  stock: z.number().nonnegative().default(0),
  coverUrl: z.string().trim().max(2048).refine((value) => !value || /^https:\/\//i.test(value), "HTTPS image URL required").optional(),
});
const outputSchema = z.object({
  recommendation: z.enum(["approve", "manual_review", "reject"]),
  confidence: z.number().min(0).max(1),
  summaryAr: z.string().trim().min(1).max(500), summaryEn: z.string().trim().min(1).max(500),
  issuesAr: z.array(z.string().trim().min(1).max(240)).max(6), issuesEn: z.array(z.string().trim().min(1).max(240)).max(6),
  suggestedRejectionReasonAr: z.string().trim().max(500), suggestedRejectionReasonEn: z.string().trim().max(500),
});

function demoOutput(input: z.infer<typeof inputSchema>, flagged: boolean) {
  const issues = [
    ...(input.storeStatus !== "active" ? ["المتجر غير نشط"] : []),
    ...(input.stock < 1 ? ["المنتج غير متوفر في المخزون"] : []),
    ...(flagged ? ["فحص السلامة أشار إلى محتوى يحتاج مراجعة"] : []),
  ];
  return {
    recommendation: issues.length ? "manual_review" as const : "approve" as const,
    confidence: issues.length ? 0.74 : 0.82,
    summaryAr: issues.length ? "يحتاج الريلز مراجعة بشرية قبل النشر." : "لا تظهر مؤشرات تشغيلية واضحة تمنع الاعتماد.",
    summaryEn: issues.length ? "The reel needs manual review before publishing." : "No clear operational blockers were detected.",
    issuesAr: issues,
    issuesEn: issues.map(() => "Manual verification required"),
    suggestedRejectionReasonAr: issues.join("، "),
    suggestedRejectionReasonEn: issues.length ? "Manual verification required." : "",
  };
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireAIActor(["admin"]);
    await assertAIFeatureEnabled("reel_review");
    enforceAIRateLimit(`${actor.id}:reel_review`);
    const input = inputSchema.parse(await request.json());
    const client = getOpenAIClient();
    if (!client) {
      if (isDemoAIAllowed()) return NextResponse.json({ data: demoOutput(input, false), moderationFlagged: false, mode: "demo" });
      throw new Error("OPENAI_NOT_CONFIGURED");
    }

    const moderationInputs: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> = [{ type: "text", text: input.caption }];
    if (input.coverUrl && /^https:\/\//i.test(input.coverUrl)) moderationInputs.push({ type: "image_url", image_url: { url: input.coverUrl } });
    const moderation = await client.moderations.create({ model: "omni-moderation-latest", input: moderationInputs });
    const moderationFlagged = moderation.results[0]?.flagged ?? false;

    const response = await client.responses.parse({
      model: getAIModel(), store: false,
      instructions: "أنت مساعد حوكمة محتوى لتجارة إلكترونية. قدّم توصية مساعدة فقط ولا تتخذ قرار النشر. افحص تطابق الكابشن مع المنتج، عدم وجود ادعاءات غير مدعومة، توفر المنتج، وحالة المتجر. عند الشك اختر manual_review. لا تعتبر النتيجة بديلًا عن قرار الإدارة.",
      input: JSON.stringify({ ...input, moderationFlagged }),
      text: { format: zodTextFormat(outputSchema, "tijvorya_reel_review") },
      max_output_tokens: 800,
    });
    if (!response.output_parsed) throw new Error("AI_ERROR");
    return NextResponse.json({ data: response.output_parsed, moderationFlagged, mode: "live", requestId: response._request_id });
  } catch (error) {
    const detail = aiErrorResponse(error);
    return NextResponse.json({ error: detail.ar, errorEn: detail.en }, { status: detail.status });
  }
}
