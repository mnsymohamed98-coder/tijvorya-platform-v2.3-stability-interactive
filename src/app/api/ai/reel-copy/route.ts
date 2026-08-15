import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import { aiErrorResponse, assertAIFeatureEnabled, enforceAIRateLimit, getAIModel, getOpenAIClient, isDemoAIAllowed, requireAIActor } from "@/lib/ai/server";

const inputSchema = z.object({
  productName: z.string().trim().min(2).max(120),
  category: z.string().trim().max(80).default(""),
  description: z.string().trim().max(1500).default(""),
  price: z.number().nonnegative().optional(),
  tone: z.enum(["premium", "friendly", "youthful", "urgent"]).default("premium"),
});
const outputSchema = z.object({
  hookAr: z.string().trim().min(1).max(120), hookEn: z.string().trim().min(1).max(120),
  captionAr: z.string().trim().min(1).max(260), captionEn: z.string().trim().min(1).max(260),
  hashtags: z.array(z.string().trim().regex(/^#[\p{L}\p{N}_]+$/u).max(50)).max(8),
  callToActionAr: z.string().trim().min(1).max(100), callToActionEn: z.string().trim().min(1).max(100),
});

function demoOutput(input: z.infer<typeof inputSchema>) {
  return {
    hookAr: `تفاصيل ${input.productName} تبدأ من أول ثانية.`,
    hookEn: `${input.productName} gets attention from the first second.`,
    captionAr: `${input.productName} — اختيار عملي بتفاصيل واضحة. شاهد المنتج وأضفه إلى سلتك مباشرة من الريلز.`,
    captionEn: `${input.productName} — practical value with clear details. Watch and add it to your cart directly from the reel.`,
    hashtags: ["#Tijvorya", `#${input.category.replace(/\s+/g, "_") || "تسوق"}`, "#ريلز_تجارية"],
    callToActionAr: "اكتشف التفاصيل واطلب الآن.",
    callToActionEn: "Explore the details and order now.",
  };
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireAIActor(["merchant", "influencer", "admin"]);
    await assertAIFeatureEnabled("reel_writer");
    enforceAIRateLimit(`${actor.id}:reel_writer`);
    const input = inputSchema.parse(await request.json());
    const client = getOpenAIClient();
    if (!client) {
      if (isDemoAIAllowed()) return NextResponse.json({ data: demoOutput(input), mode: "demo" });
      throw new Error("OPENAI_NOT_CONFIGURED");
    }
    const response = await client.responses.parse({
      model: getAIModel(), store: false,
      instructions: "أنت محرر ريلز تجارية لمنصة Tijvorya. اكتب Hook قصيرًا وكابشن لا يتجاوز 260 حرفًا لكل لغة، مع دعوة شراء واضحة وهاشتاقات قليلة وذات صلة. لا تخترع خصومات أو مواصفات.",
      input: JSON.stringify(input),
      text: { format: zodTextFormat(outputSchema, "tijvorya_reel_copy") },
      max_output_tokens: 700,
    });
    if (!response.output_parsed) throw new Error("AI_ERROR");
    return NextResponse.json({ data: response.output_parsed, mode: "live", requestId: response._request_id });
  } catch (error) {
    const detail = aiErrorResponse(error);
    return NextResponse.json({ error: detail.ar, errorEn: detail.en }, { status: detail.status });
  }
}
