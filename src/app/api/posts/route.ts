import { NextResponse } from "next/server";
import { getScrapedPosts } from "@/lib/posts-store";

export const GET = async () => {
  const posts = await getScrapedPosts();
  return NextResponse.json({ posts });
};
