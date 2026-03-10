import { z } from "zod";

export const trainingExampleSchema = z.object({
  id: z.string(),
  systemPrompt: z.string(),
  userPrompt: z.string(),
  imageUrl: z.string(),
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
  imageUrl: z.string().min(1, "Image URL is required"),
  assistantResponse: z.string().min(1, "Example caption is required"),
});

export type AddExampleInput = z.infer<typeof addExampleSchema>;

export const deleteExampleSchema = z.object({
  id: z.string().min(1),
});

export const generateSchema = z.object({
  imageUrl: z.string().min(1, "Image URL is required"),
  modelId: z.string().min(1, "Model ID is required"),
});

export type GenerateInput = z.infer<typeof generateSchema>;

export type FineTuneJob = {
  readonly id: string;
  readonly status: string;
  readonly model: string;
  readonly fine_tuned_model: string | null;
  readonly created_at: number;
  readonly trained_tokens: number | null;
};

export const scrapeSchema = z.object({
  username: z.string().min(1, "Instagram username is required"),
  resultsLimit: z.number().min(1).max(200).default(50),
});

export type ScrapeInput = z.infer<typeof scrapeSchema>;

export type InstagramPost = {
  readonly id: string;
  readonly caption: string;
  readonly imageUrl: string;
  readonly timestamp: string;
  readonly likesCount: number;
  readonly url: string;
  readonly addedToTraining: boolean;
};

export const scrapedPostsSchema = z.object({
  posts: z.array(
    z.object({
      id: z.string(),
      caption: z.string(),
      imageUrl: z.string(),
      timestamp: z.string(),
      likesCount: z.number(),
      url: z.string(),
      addedToTraining: z.boolean(),
    })
  ),
});

export type ScrapedPostsData = z.infer<typeof scrapedPostsSchema>;
