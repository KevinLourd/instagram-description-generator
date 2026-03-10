import { readFile, writeFile } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import type { TrainingData, TrainingExample, AddExampleInput } from "./types";
import { trainingDataSchema } from "./types";

const DEFAULT_DATA_PATH = path.join(process.cwd(), "data", "training-data.json");

export const getTrainingExamples = async (
  filePath = DEFAULT_DATA_PATH
): Promise<readonly TrainingExample[]> => {
  const raw = await readFile(filePath, "utf-8");
  const data = trainingDataSchema.parse(JSON.parse(raw));
  return data.examples;
};

export const addTrainingExample = async (
  input: AddExampleInput,
  filePath = DEFAULT_DATA_PATH
): Promise<TrainingExample> => {
  const examples = await getTrainingExamples(filePath);
  const newExample: TrainingExample = {
    id: uuidv4(),
    ...input,
    createdAt: new Date().toISOString(),
  };
  const updated: TrainingData = {
    examples: [...examples, newExample],
  };
  await writeFile(filePath, JSON.stringify(updated, null, 2), "utf-8");
  return newExample;
};

export const removeTrainingExample = async (
  id: string,
  filePath = DEFAULT_DATA_PATH
): Promise<boolean> => {
  const examples = await getTrainingExamples(filePath);
  const filtered = examples.filter((e) => e.id !== id);
  if (filtered.length === examples.length) return false;
  const updated: TrainingData = { examples: [...filtered] };
  await writeFile(filePath, JSON.stringify(updated, null, 2), "utf-8");
  return true;
};

export const exportAsJsonl = async (
  filePath = DEFAULT_DATA_PATH
): Promise<string> => {
  const examples = await getTrainingExamples(filePath);
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
