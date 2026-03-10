import { NextResponse } from "next/server";
import { getScrapedPosts, markAsTraining } from "@/lib/posts-store";
import { addTrainingExample } from "@/lib/training-store";

const DEFAULT_SYSTEM_PROMPT =
  "You are an expert Instagram caption writer. Write engaging, authentic captions that match the style and tone of this account.";

export const POST = async () => {
  const posts = await getScrapedPosts();
  const notAdded = posts.filter((p) => !p.addedToTraining);

  let added = 0;
  for (const post of notAdded) {
    const userPrompt = post.imageUrl
      ? `Instagram post image: ${post.imageUrl}`
      : "Instagram post";

    await addTrainingExample({
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      userPrompt,
      assistantResponse: post.caption,
    });
    await markAsTraining(post.id);
    added++;
  }

  return NextResponse.json({ added, total: posts.length });
};
