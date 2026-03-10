import { NextResponse } from "next/server";
import { getPostById, markAsTraining } from "@/lib/posts-store";
import { addTrainingExample, downloadImageAsBase64 } from "@/lib/training-store";

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
  if (!post.imageUrl) {
    return NextResponse.json(
      { error: "This post has no image and cannot be used for training" },
      { status: 400 }
    );
  }

  const imageBase64 = await downloadImageAsBase64(post.imageUrl);
  if (!imageBase64) {
    return NextResponse.json(
      { error: "Could not download image. The link may have expired — try syncing your posts again." },
      { status: 400 }
    );
  }

  await addTrainingExample({
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    userPrompt: "Write an Instagram caption for this photo.",
    imageUrl: post.imageUrl,
    imageBase64,
    assistantResponse: post.caption,
  });

  await markAsTraining(postId);

  return NextResponse.json({ success: true });
};
