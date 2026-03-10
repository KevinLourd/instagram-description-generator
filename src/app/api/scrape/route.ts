import { NextResponse } from "next/server";
import { scrapeSchema } from "@/lib/types";
import type { InstagramPost } from "@/lib/types";

const APIFY_TOKEN = process.env.APIFY_API_TOKEN ?? process.env.APIFY_API_KEY;
const ACTOR_ID = "apify~instagram-scraper";
const SYNC_ENDPOINT = `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items`;

export const POST = async (request: Request) => {
  if (!APIFY_TOKEN) {
    return NextResponse.json(
      { error: "APIFY_API_TOKEN or APIFY_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const body = await request.json();
  const parsed = scrapeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { username, resultsLimit } = parsed.data;

  const res = await fetch(`${SYNC_ENDPOINT}?token=${APIFY_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directUrls: [`https://www.instagram.com/${username}/`],
      resultsType: "posts",
      resultsLimit,
      searchType: "hashtag",
      searchLimit: 1,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: `Apify error: ${res.status} - ${text.slice(0, 200)}` },
      { status: 502 }
    );
  }

  const rawPosts = await res.json();

  const posts: InstagramPost[] = (rawPosts as Record<string, unknown>[])
    .filter(
      (p) => typeof p.caption === "string" && p.caption.trim().length > 0
    )
    .map((p) => ({
      caption: p.caption as string,
      imageUrl: (p.displayUrl ?? p.imageUrl ?? "") as string,
      timestamp: (p.timestamp ?? p.takenAtTimestamp ?? "") as string,
      likesCount: (p.likesCount ?? 0) as number,
      url: (p.url ?? "") as string,
    }));

  return NextResponse.json({ posts, total: rawPosts.length });
};
