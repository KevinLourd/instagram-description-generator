"use client";

import { useState } from "react";
import Image from "next/image";
import type { InstagramPost } from "@/lib/types";

type Props = {
  readonly post: InstagramPost;
  readonly onClose: () => void;
  readonly onAdded: () => void;
};

export const PostDetailPanel = ({ post, onClose, onAdded }: Props) => {
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const handleAddToTraining = async () => {
    setAdding(true);
    setError("");
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      onAdded();
    } catch {
      setError("Connection issue. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-[480px] flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl">
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

      <div className="border-t border-zinc-800 p-6">
        {post.addedToTraining ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-green-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Added to training
            </div>
            <p className="text-xs text-zinc-500">
              This post is part of the AI&apos;s learning data. Note: OpenAI may
              skip this image during training if it contains people or faces — this
              is an automatic safety filter applied by OpenAI on all vision
              fine-tuning data.
            </p>
          </div>
        ) : !post.imageUrl ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-orange-400">
              Cannot train on this post
            </p>
            <p className="text-xs text-zinc-500">
              This post has no image. Vision fine-tuning requires an image for
              each training example.
            </p>
          </div>
        ) : (
          <>
            {error && (
              <p className="mb-2 text-sm text-red-400">{error}</p>
            )}
            <button
              onClick={handleAddToTraining}
              disabled={adding}
              className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {adding ? "Adding..." : "Add to training"}
            </button>
            <p className="mt-2 text-xs text-zinc-500">
              OpenAI may skip this image during training if it contains people
              or faces.
            </p>
          </>
        )}
      </div>
    </div>
  );
};
