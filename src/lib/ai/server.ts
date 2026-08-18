import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";

import {
  aiErrorResponse,
  assertAIFeatureEnabled,
  enforceAIRateLimit,
  getAIModel,
  getOpenAIClient,
  isDemoAIAllowed,
  requireAIActor,
} from "@/lib/ai/server";

const inputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  category: z.string().trim().min(2).max(80),
  features: z.string().trim().max(1000).default(""),
  audience: z.string().trim().max(200).default(""),
  tone: z
    .enum(["premium", "friendly", "youthful", "sales"])
    .default("premium"),
});

const outputSchema = z.object({
  nameEn: z.string().trim().min(1).max(160),
  descriptionAr: z.string().trim().min(1).max(1200),
  descriptionEn: z.string().trim().min(1).max(1200),
  sellingPointsAr: z
    .array(z.string().trim().min(1).max(180))
    .max(5),
  sellingPointsEn: z
    .array(z.string().trim().min(1).max(180))
    .max(5),
  seoKeywords: z
    .array(z.string().trim().min(1).max(60))
    .max(10),
});

function demoOutput(input: z.infer<typeof inputSchema>) {
  const details =
    input.features ||
    "جودة مختارة وتصميم عملي للاستخدام اليومي";

  return {
    nameEn: input.name,
    descriptionAr: `${input.name} من فئة ${input.category}، يجمع بين ${details}. صُمم ليقدّم تجربة عملية واضحة مع تفاصيل تساعد العميل على اتخاذ قرار الشراء بثقة.`,
    descriptionEn: `${input.name} is a ${input.category} product combining selected quality with practical everyday value. Its clear details help customers buy with confidence.`,
    sellingPointsAr: [
      "جودة مختارة",
      "تفاصيل واضحة",
      "مناسب للاستخدام اليومي",
    ],
    sellingPointsEn: [
      "Selected quality",
      "Clear product details",
      "Built for everyday use",
    ],
    seoKeywords: [
      input.name,
      input.category,
      "Tijvorya",
    ],
  };
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireAIActor([
      "merchant",
      "influencer",
      "admin",
    ]);

    await assertAIFeatureEnabled("product_writer");

    enforceAIRateLimit(
      `${actor.id}:product_writer`
    );

    const rawBody = await request.json();

    const parsedInput = inputSchema.safeParse(rawBody);

    if (!parsedInput.success) {
      console.error(
        "PRODUCT_COPY_INVALID_INPUT",
        parsedInput.error.flatten()
      );

      return NextResponse.json(
        {
          error: "البيانات المدخلة غير صالحة.",
          errorEn: "Invalid input.",
          debug: {
            type: "INVALID_INPUT",
            issues: parsedInput.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const input = parsedInput.data;

    const client = getOpenAIClient();

    if (!client) {
      if (isDemoAIAllowed()) {
        return NextResponse.json({
          data: demoOutput(input),
          mode: "demo",
        });
      }

      throw new Error("OPENAI_NOT_CONFIGURED");
    }

    const model = getAIModel();

    console.log("PRODUCT_COPY_AI_REQUEST", {
      model,
      actorId: actor.id,
      role: actor.role,
    });

    const response = await client.responses.parse({
      model,
      store: false,
      instructions:
        "أنت كاتب محتوى تجارة إلكترونية لمنصة Tijvorya. اكتب محتوى دقيقًا وغير مضلل، بلا ادعاءات طبية أو ضمانات غير مذكورة. اكتب العربية الفصحى السهلة والإنجليزية الطبيعية. لا تخترع مواصفات أو خصومات.",
      input: JSON.stringify(input),
      text: {
        format: zodTextFormat(
          outputSchema,
          "tijvorya_product_copy"
        ),
      },
      max_output_tokens: 900,
    });

    if (!response.output_parsed) {
      console.error(
        "PRODUCT_COPY_NO_PARSED_OUTPUT",
        {
          id: response.id,
          status: response.status,
          output: response.output,
        }
      );

      throw new Error("AI_ERROR");
    }

    return NextResponse.json({
      data: response.output_parsed,
      mode: "live",
      requestId: response._request_id,
      model,
    });
  } catch (error) {
    console.error(
      "PRODUCT_COPY_AI_ERROR",
      error
    );

    const detail = aiErrorResponse(error);

    const debug =
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            cause:
              error.cause instanceof Error
                ? error.cause.message
                : error.cause
                  ? String(error.cause)
                  : undefined,
          }
        : {
            name: "UnknownError",
            message: String(error),
          };

    return NextResponse.json(
      {
        error: detail.ar,
        errorEn: detail.en,
        debug,
      },
      {
        status: detail.status,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}