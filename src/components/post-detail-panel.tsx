"use client";

import Image from "next/image";
import type { InstagramPost } from "@/lib/types";

type Props = {
  readonly post: InstagramPost;
  readonly onClose: () => void;
};

export const PostDetailPanel = ({ post, onClose }: Props) => {

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-full flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl md:w-[480px]">
      <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
        <h2 className="text-sm font-semibold text-white">Post Details</h2>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {post.imageUrl && (
          <div className="relative aspect-square w-full">
            <Image
              src={post.imageUrl}
              alt="Instagram post"
              fill
              sizes="480px"
              className="rounded-lg object-cover"
            />
          </div>
        )}

        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>{post.likesCount != null && post.likesCount >= 0 ? `${post.likesCount.toLocaleString()} likes` : "— likes"}</span>
            {post.timestamp && (
              <span>{new Date(post.timestamp).toLocaleDateString()}</span>
            )}
          </div>

          <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
            {post.caption}
          </p>

          {post.url && (
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs text-zinc-500 hover:text-zinc-300"
            >
              See on Instagram
            </a>
          )}
        </div>
      </div>

    </div>
  );
};
