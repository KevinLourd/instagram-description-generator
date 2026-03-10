import { neon } from "@neondatabase/serverless";

const run = async () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log("DATABASE_URL not set, skipping migration");
    return;
  }

  const sql = neon(databaseUrl);

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
  await sql`
    ALTER TABLE training_examples ADD COLUMN IF NOT EXISTS image_base64 TEXT NOT NULL DEFAULT ''
  `;

  // Reset training examples that have no base64 data (from before the migration)
  const stale = await sql`SELECT count(*) as cnt FROM training_examples WHERE image_base64 = ''`;
  const staleCount = Number(stale[0]?.cnt ?? 0);
  if (staleCount > 0) {
    await sql`DELETE FROM training_examples WHERE image_base64 = ''`;
    await sql`UPDATE scraped_posts SET added_to_training = false WHERE added_to_training = true`;
    console.log(`Reset ${staleCount} stale training examples (no base64). Posts marked as not trained.`);
  }

  console.log("Migration complete");
};

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
