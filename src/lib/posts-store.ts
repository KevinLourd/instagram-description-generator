import { readFile, writeFile } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import type { InstagramPost, ScrapedPostsData } from "./types";
import { scrapedPostsSchema } from "./types";

const DEFAULT_DATA_PATH = path.join(
  process.cwd(),
  "data",
  "scraped-posts.json"
);

const readStore = async (
  filePath = DEFAULT_DATA_PATH
): Promise<InstagramPost[]> => {
  try {
    const raw = await readFile(filePath, "utf-8");
    const data = scrapedPostsSchema.parse(JSON.parse(raw));
    return data.posts;
  } catch {
    return [];
  }
};

const writeStore = async (
  posts: InstagramPost[],
  filePath = DEFAULT_DATA_PATH
): Promise<void> => {
  const data: ScrapedPostsData = { posts: [...posts] };
  await writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
};

export const getScrapedPosts = async (
  filePath = DEFAULT_DATA_PATH
): Promise<InstagramPost[]> => {
  return readStore(filePath);
};

export const addScrapedPosts = async (
  newPosts: Omit<InstagramPost, "id" | "addedToTraining">[],
  filePath = DEFAULT_DATA_PATH
): Promise<InstagramPost[]> => {
  const existing = await readStore(filePath);
  const existingUrls = new Set(existing.map((p) => p.url));

  const toAdd: InstagramPost[] = newPosts
    .filter((p) => !existingUrls.has(p.url))
    .map((p) => ({
      ...p,
      id: uuidv4(),
      addedToTraining: false,
    }));

  const updated = [...existing, ...toAdd];
  await writeStore(updated, filePath);
  return toAdd;
};

export const markAsTraining = async (
  postId: string,
  filePath = DEFAULT_DATA_PATH
): Promise<InstagramPost | null> => {
  const posts = await readStore(filePath);
  const index = posts.findIndex((p) => p.id === postId);
  if (index === -1) return null;

  const updated = posts.map((p) =>
    p.id === postId ? { ...p, addedToTraining: true } : p
  );
  await writeStore(updated, filePath);
  return updated[index];
};

export const getPostById = async (
  postId: string,
  filePath = DEFAULT_DATA_PATH
): Promise<InstagramPost | null> => {
  const posts = await readStore(filePath);
  return posts.find((p) => p.id === postId) ?? null;
};
