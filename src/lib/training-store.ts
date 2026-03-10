import { sql, ensureTables } from "./db";
import type { TrainingExample, AddExampleInput } from "./types";

export const getTrainingExamples = async (): Promise<readonly TrainingExample[]> => {
  await ensureTables();
  const rows = await sql`SELECT id, system_prompt, user_prompt, image_url, assistant_response, created_at FROM training_examples ORDER BY created_at ASC`;
  return rows.map((r) => ({
    id: r.id as string,
    systemPrompt: r.system_prompt as string,
    userPrompt: r.user_prompt as string,
    imageUrl: (r.image_url as string) ?? "",
    assistantResponse: r.assistant_response as string,
    createdAt: (r.created_at as Date).toISOString(),
  }));
};

export const addTrainingExample = async (
  input: AddExampleInput
): Promise<TrainingExample> => {
  await ensureTables();
  const rows = await sql`INSERT INTO training_examples (system_prompt, user_prompt, image_url, assistant_response) VALUES (${input.systemPrompt}, ${input.userPrompt}, ${input.imageUrl}, ${input.assistantResponse}) RETURNING id, system_prompt, user_prompt, image_url, assistant_response, created_at`;
  const r = rows[0];
  return {
    id: r.id as string,
    systemPrompt: r.system_prompt as string,
    userPrompt: r.user_prompt as string,
    imageUrl: (r.image_url as string) ?? "",
    assistantResponse: r.assistant_response as string,
    createdAt: (r.created_at as Date).toISOString(),
  };
};

export const removeTrainingExample = async (id: string): Promise<boolean> => {
  await ensureTables();
  const rows = await sql`DELETE FROM training_examples WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
};

const downloadImageAsBase64 = async (url: string): Promise<string | null> => {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
};

export const exportAsJsonl = async (): Promise<string> => {
  const examples = await getTrainingExamples();
  const withImages = examples.filter((ex) => ex.imageUrl);

  // Download all images in parallel for speed
  const results = await Promise.all(
    withImages.map(async (ex) => {
      const base64Url = await downloadImageAsBase64(ex.imageUrl);
      return base64Url ? { ex, base64Url } : null;
    })
  );

  return results
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .map(({ ex, base64Url }) =>
      JSON.stringify({
        messages: [
          { role: "system", content: ex.systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: base64Url, detail: "low" },
              },
              { type: "text", text: ex.userPrompt },
            ],
          },
          { role: "assistant", content: ex.assistantResponse },
        ],
      })
    )
    .join("\n");
};
