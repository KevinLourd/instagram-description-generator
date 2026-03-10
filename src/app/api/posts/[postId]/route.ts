import { NextResponse } from "next/server";
import { getPostById, markAsTraining } from "@/lib/posts-store";
import { addTrainingExample } from "@/lib/training-store";

const DEFAULT_SYSTEM_PROMPT =
  "You are an expert Instagram caption writer. Write engaging, authentic captions that match the style and tone of this account.";

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ postId: string }> }
) => {
  const { postId } = await params;
  const post = await getPostById(postId);
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
  return NextResponse.json({ post });
};

export const POST = async (
  _request: Request,
  { params }: { params: Promise<{ postId: string }> }
) => {
  const { postId } = await params;
  const post = await getPostById(postId);
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
  if (post.addedToTraining) {
    return NextResponse.json(
      { error: "Already added to training" },
      { status: 400 }
    );
  }

  const userPrompt = post.imageUrl
    ? `Instagram post image: ${post.imageUrl}`
    : "Instagram post";

  await addTrainingExample({
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    userPrompt,
    assistantResponse: post.caption,
  });

  await markAsTraining(postId);

  return NextResponse.json({ success: true });
};
