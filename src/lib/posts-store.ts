import { sql, ensureTables } from "./db";
import type { InstagramPost } from "./types";

const rowToPost = (r: Record<string, unknown>): InstagramPost => ({
  id: r.id as string,
  caption: r.caption as string,
  imageUrl: r.image_url as string,
  timestamp: r.timestamp as string,
  likesCount: r.likes_count as number,
  url: r.url as string,
  addedToTraining: r.added_to_training as boolean,
});

export const getScrapedPosts = async (): Promise<InstagramPost[]> => {
  await ensureTables();
  const rows = await sql`SELECT id, caption, image_url, timestamp, likes_count, url, added_to_training FROM scraped_posts ORDER BY created_at DESC`;
  return rows.map(rowToPost);
};

export const addScrapedPosts = async (
  newPosts: Omit<InstagramPost, "id" | "addedToTraining">[]
): Promise<InstagramPost[]> => {
  if (newPosts.length === 0) return [];
  await ensureTables();

  const added: InstagramPost[] = [];
  for (const p of newPosts) {
    try {
      const rows = await sql`INSERT INTO scraped_posts (caption, image_url, timestamp, likes_count, url) VALUES (${p.caption}, ${p.imageUrl}, ${p.timestamp}, ${p.likesCount}, ${p.url}) ON CONFLICT (url) DO NOTHING RETURNING id, caption, image_url, timestamp, likes_count, url, added_to_training`;
      if (rows.length > 0) {
        added.push(rowToPost(rows[0]));
      }
    } catch {
      // skip duplicates
    }
  }
  return added;
};

export const markAsTraining = async (
  postId: string
): Promise<InstagramPost | null> => {
  await ensureTables();
  const rows = await sql`UPDATE scraped_posts SET added_to_training = true WHERE id = ${postId} RETURNING id, caption, image_url, timestamp, likes_count, url, added_to_training`;
  return rows.length > 0 ? rowToPost(rows[0]) : null;
};

export const getPostById = async (
  postId: string
): Promise<InstagramPost | null> => {
  await ensureTables();
  const rows = await sql`SELECT id, caption, image_url, timestamp, likes_count, url, added_to_training FROM scraped_posts WHERE id = ${postId}`;
  return rows.length > 0 ? rowToPost(rows[0]) : null;
};
