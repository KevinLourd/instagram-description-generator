"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import type { InstagramPost } from "@/lib/types";
import { PostDetailPanel } from "@/components/post-detail-panel";
import { extractUsername } from "@/lib/instagram";

const INSTAGRAM_USERNAME = extractUsername(
  process.env.NEXT_PUBLIC_INSTAGRAM_USERNAME ?? ""
);

const PostsPage = () => {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<InstagramPost | null>(null);

  const [scraping, setScraping] = useState(false);
  const [training, setTraining] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [visibleCount, setVisibleCount] = useState(0);
  const staggerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPosts = useCallback(async (stagger = false) => {
    setLoading(true);
    try {
      const res = await fetch("/api/posts");
      const data = await res.json();
      const newPosts: InstagramPost[] = data.posts ?? [];
      setPosts(newPosts);
      if (stagger && newPosts.length > 0) {
        setVisibleCount(0);
      } else {
        setVisibleCount(newPosts.length);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    if (visibleCount < posts.length) {
      staggerTimer.current = setTimeout(() => {
        setVisibleCount((c) => c + 1);
      }, 80);
      return () => {
        if (staggerTimer.current) clearTimeout(staggerTimer.current);
      };
    }
  }, [visibleCount, posts.length]);

  const handleSync = async () => {
    if (!INSTAGRAM_USERNAME) return;
    setScraping(true);
    setMessage(null);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: INSTAGRAM_USERNAME, resultsLimit: 50 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: typeof data.error === "string" ? data.error : "Something went wrong." });
        return;
      }
      setMessage({
        type: "success",
        text: data.added > 0
          ? `${data.added} new post${data.added !== 1 ? "s" : ""} imported!`
          : "No new posts found. You're up to date!",
      });
      fetchPosts(true);
    } catch {
      setMessage({ type: "error", text: "Connection issue. Please try again." });
    } finally {
      setScraping(false);
    }
  };

  const handleTrainAll = async () => {
    const notTrained = posts.filter((p) => !p.addedToTraining && p.imageUrl);
    if (notTrained.length === 0) {
      setMessage({ type: "success", text: "All posts are already added to training." });
      return;
    }

    setTraining(true);
    setMessage(null);
    let added = 0;
    let skipped = 0;

    for (const post of notTrained) {
      try {
        const res = await fetch(`/api/posts/${post.id}`, { method: "POST" });
        if (res.ok) {
          added++;
        } else {
          skipped++;
        }
      } catch {
        skipped++;
      }
    }

    // Now start fine-tuning
    try {
      const res = await fetch("/api/fine-tune", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMessage({
          type: "success",
          text: `${added} post${added !== 1 ? "s" : ""} added to training${skipped > 0 ? ` (${skipped} skipped)` : ""}. Fine-tuning started! This takes 10-30 minutes.`,
        });
      } else {
        setMessage({
          type: added > 0 ? "success" : "error",
          text: `${added} post${added !== 1 ? "s" : ""} added. ${data.error ?? "Could not start fine-tuning yet."}`,
        });
      }
    } catch {
      setMessage({
        type: "success",
        text: `${added} post${added !== 1 ? "s" : ""} added. Could not start fine-tuning — try again later.`,
      });
    }

    fetchPosts();
    setTraining(false);
  };

  const handleAdded = () => {
    fetchPosts();
    if (selectedPost) {
      setSelectedPost({ ...selectedPost, addedToTraining: true });
    }
  };

  const filtered = posts.slice(0, visibleCount);
  const addedCount = posts.filter((p) => p.addedToTraining).length;
  const notAddedCount = posts.filter((p) => !p.addedToTraining && p.imageUrl).length;

  return (
    <div className={selectedPost ? "mr-[480px]" : ""}>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">My Posts</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {posts.length === 0
              ? "Sync your Instagram posts to get started."
              : `${posts.length} post${posts.length !== 1 ? "s" : ""} — ${addedCount} trained, ${notAddedCount} ready to train`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {notAddedCount > 0 && (
            <button
              onClick={handleTrainAll}
              disabled={training}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m-6.063 16.658l.26-1.477m2.605-14.772l.26-1.477m0 17.726l-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205L12 12m6.894 5.785l-1.149-.964M6.256 7.178l-1.15-.964m15.352 8.864l-1.41-.513M4.954 9.435l-1.41-.514M12.002 12l-3.75 6.495" />
              </svg>
              {training ? "Training..." : `Train ${notAddedCount} new post${notAddedCount !== 1 ? "s" : ""}`}
            </button>
          )}
          <button
            onClick={handleSync}
            disabled={scraping || !INSTAGRAM_USERNAME}
            className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className={`h-4 w-4 ${scraping ? "animate-spin" : ""}`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
              />
            </svg>
            {scraping ? "Syncing..." : posts.length === 0 ? "Sync Instagram" : "Sync"}
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-4 rounded-lg border p-3 text-sm ${
          message.type === "success"
            ? "border-green-800 bg-green-950/50 text-green-200"
            : "border-red-800 bg-red-950/50 text-red-200"
        }`}>
          {message.text}
        </div>
      )}

      {/* Posts table */}
      {loading ? (
        <p className="text-sm text-zinc-400">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-zinc-400">
          No posts yet. Click &quot;Sync Instagram&quot; to import your posts.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-800">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">
                  Photo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">
                  Caption
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400">
                  Likes
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-zinc-400">
                  Training
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((post) => (
                <tr
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className={`cursor-pointer border-b border-zinc-800/50 transition-colors hover:bg-zinc-900/50 ${
                    selectedPost?.id === post.id ? "bg-zinc-800/50" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    {post.imageUrl ? (
                      <div className="relative h-10 w-10">
                        <Image
                          src={post.imageUrl}
                          alt=""
                          fill
                          sizes="40px"
                          className="rounded object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded bg-zinc-800" />
                    )}
                  </td>
                  <td className="max-w-xs px-4 py-3">
                    <p className="truncate text-sm text-zinc-200">
                      {post.caption}
                    </p>
                    {post.timestamp && (
                      <p className="text-xs text-zinc-500">
                        {new Date(post.timestamp).toLocaleDateString()}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-zinc-400">
                    {post.likesCount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {post.addedToTraining ? (
                      <span className="inline-flex items-center rounded-full bg-green-900/30 px-2 py-0.5 text-xs text-green-400">
                        Trained
                      </span>
                    ) : !post.imageUrl ? (
                      <span className="inline-flex items-center rounded-full bg-orange-900/30 px-2 py-0.5 text-xs text-orange-400">
                        No image
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                        Not trained
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Right panel */}
      {selectedPost && (
        <PostDetailPanel
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onAdded={handleAdded}
        />
      )}
    </div>
  );
};

export default PostsPage;
