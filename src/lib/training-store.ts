import { sql } from "./db";
import type { TrainingExample, AddExampleInput } from "./types";

export const getTrainingExamples = async (): Promise<readonly TrainingExample[]> => {
  const rows = await sql`SELECT id, system_prompt, user_prompt, assistant_response, created_at FROM training_examples ORDER BY created_at ASC`;
  return rows.map((r) => ({
    id: r.id as string,
    systemPrompt: r.system_prompt as string,
    userPrompt: r.user_prompt as string,
    assistantResponse: r.assistant_response as string,
    createdAt: (r.created_at as Date).toISOString(),
  }));
};

export const addTrainingExample = async (
  input: AddExampleInput
): Promise<TrainingExample> => {
  const rows = await sql`INSERT INTO training_examples (system_prompt, user_prompt, assistant_response) VALUES (${input.systemPrompt}, ${input.userPrompt}, ${input.assistantResponse}) RETURNING id, system_prompt, user_prompt, assistant_response, created_at`;
  const r = rows[0];
  return {
    id: r.id as string,
    systemPrompt: r.system_prompt as string,
    userPrompt: r.user_prompt as string,
    assistantResponse: r.assistant_response as string,
    createdAt: (r.created_at as Date).toISOString(),
  };
};

export const removeTrainingExample = async (id: string): Promise<boolean> => {
  const rows = await sql`DELETE FROM training_examples WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
};

export const exportAsJsonl = async (): Promise<string> => {
  const examples = await getTrainingExamples();
  return examples
    .map((ex) =>
      JSON.stringify({
        messages: [
          { role: "system", content: ex.systemPrompt },
          { role: "user", content: ex.userPrompt },
          { role: "assistant", content: ex.assistantResponse },
        ],
      })
    )
    .join("\n");
};
