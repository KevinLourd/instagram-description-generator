import { sql, ensureTables } from "./db";
import type { TrainingExample, AddExampleInput } from "./types";

export const getTrainingExamples = async (): Promise<readonly TrainingExample[]> => {
  await ensureTables();
  const rows = await sql`SELECT id, system_prompt, user_prompt, image_url, image_base64, assistant_response, created_at FROM training_examples ORDER BY created_at ASC`;
  return rows.map((r) => ({
    id: r.id as string,
    systemPrompt: r.system_prompt as string,
    userPrompt: r.user_prompt as string,
    imageUrl: (r.image_url as string) ?? "",
    imageBase64: (r.image_base64 as string) ?? "",
    assistantResponse: r.assistant_response as string,
    createdAt: (r.created_at as Date).toISOString(),
  }));
};

export const addTrainingExample = async (
  input: AddExampleInput
): Promise<TrainingExample> => {
  await ensureTables();
  const rows = await sql`INSERT INTO training_examples (system_prompt, user_prompt, image_url, image_base64, assistant_response) VALUES (${input.systemPrompt}, ${input.userPrompt}, ${input.imageUrl}, ${input.imageBase64}, ${input.assistantResponse}) RETURNING id, system_prompt, user_prompt, image_url, image_base64, assistant_response, created_at`;
  const r = rows[0];
  return {
    id: r.id as string,
    systemPrompt: r.system_prompt as string,
    userPrompt: r.user_prompt as string,
    imageUrl: (r.image_url as string) ?? "",
    imageBase64: (r.image_base64 as string) ?? "",
    assistantResponse: r.assistant_response as string,
    createdAt: (r.created_at as Date).toISOString(),
  };
};

export const removeTrainingExample = async (id: string): Promise<boolean> => {
  await ensureTables();
  const rows = await sql`DELETE FROM training_examples WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
};

export const downloadImageAsBase64 = async (url: string): Promise<string | null> => {
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

  return examples
    .filter((ex) => ex.imageBase64)
    .map((ex) =>
      JSON.stringify({
        messages: [
          { role: "system", content: ex.systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: ex.imageBase64, detail: "low" },
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
