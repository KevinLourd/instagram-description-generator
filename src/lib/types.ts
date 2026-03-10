import { z } from "zod";

export const trainingExampleSchema = z.object({
  id: z.string(),
  systemPrompt: z.string(),
  userPrompt: z.string(),
  assistantResponse: z.string(),
  createdAt: z.string(),
});

export type TrainingExample = z.infer<typeof trainingExampleSchema>;

export const trainingDataSchema = z.object({
  examples: z.array(trainingExampleSchema),
});

export type TrainingData = z.infer<typeof trainingDataSchema>;

export const addExampleSchema = z.object({
  systemPrompt: z.string().min(1, "System prompt is required"),
  userPrompt: z.string().min(1, "User prompt is required"),
  assistantResponse: z.string().min(1, "Example caption is required"),
});

export type AddExampleInput = z.infer<typeof addExampleSchema>;

export const deleteExampleSchema = z.object({
  id: z.string().min(1),
});

export const generateSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  modelId: z.string().min(1, "Model ID is required"),
});

export type GenerateInput = z.infer<typeof generateSchema>;

export type FineTuneJob = {
  readonly id: string;
  readonly status: string;
  readonly model: string;
  readonly fine_tuned_model: string | null;
  readonly created_at: number;
};
