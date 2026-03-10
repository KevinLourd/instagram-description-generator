import { neon } from "@neondatabase/serverless";

export const sql = neon(process.env.DATABASE_URL!);

let migrated = false;

export const ensureTables = async () => {
  if (migrated) return;
  await sql`
    CREATE TABLE IF NOT EXISTS scraped_posts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      caption TEXT NOT NULL DEFAULT '',
      image_url TEXT NOT NULL DEFAULT '',
      timestamp TEXT NOT NULL DEFAULT '',
      likes_count INTEGER NOT NULL DEFAULT 0,
      url TEXT NOT NULL DEFAULT '',
      added_to_training BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS scraped_posts_url_idx ON scraped_posts (url)
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS training_examples (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      system_prompt TEXT NOT NULL,
      user_prompt TEXT NOT NULL,
      image_url TEXT NOT NULL DEFAULT '',
      assistant_response TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`
    ALTER TABLE training_examples ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT ''
  `;
  migrated = true;
};
