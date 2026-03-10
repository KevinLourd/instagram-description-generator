import { NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";
import { generateSchema } from "@/lib/types";

const DEFAULT_SYSTEM_PROMPT = `You are an expert Instagram caption writer. You write engaging, authentic captions that match the style and tone of the account. Include relevant hashtags when appropriate. Keep captions concise but impactful.`;

export const POST = async (request: Request) => {
  const body = await request.json();
  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const openai = getOpenAIClient();
  const completion = await openai.chat.completions.create({
    model: parsed.data.modelId,
    messages: [
      { role: "system", content: DEFAULT_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: parsed.data.imageUrl, detail: "low" },
          },
          {
            type: "text",
            text: "Write an Instagram caption for this photo.",
          },
        ],
      },
    ],
    temperature: 0.8,
    max_tokens: 500,
  });

  const caption = completion.choices[0]?.message?.content ?? "";
  return NextResponse.json({ caption });
};
