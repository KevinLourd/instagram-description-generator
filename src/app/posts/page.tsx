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
  const [filter, setFilter] = useState<"all" | "added" | "not-added">("all");

  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState("");
  const [scrapeResult, setScrapeResult] = useState("");
  const [visibleCount, setVisibleCount] = useState(0);
  const staggerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [batchAdding, setBatchAdding] = useState(false);
  const [batchResult, setBatchResult] = useState("");

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

  const handleScrape = async () => {
    if (!INSTAGRAM_USERNAME) return;
    setScraping(true);
    setScrapeError("");
    setScrapeResult("");
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: INSTAGRAM_USERNAME,
          resultsLimit: 50,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setScrapeError(
          typeof data.error === "string"
            ? data.error
            : "Something went wrong. Please try again."
        );
        return;
      }
      if (data.added > 0) {
        setScrapeResult(`${data.added} new post${data.added !== 1 ? "s" : ""} imported!`);
      } else {
        setScrapeResult("No new posts found. You're up to date!");
      }
      fetchPosts(true);
    } catch {
      setScrapeError("Connection issue. Please check your internet and try again.");
    } finally {
      setScraping(false);
    }
  };

  const handleAdded = () => {
    fetchPosts();
    if (selectedPost) {
      setSelectedPost({ ...selectedPost, addedToTraining: true });
    }
  };

  const handleBatchAdd = async () => {
    setBatchAdding(true);
    setBatchResult("");
    try {
      const res = await fetch("/api/posts/batch-add", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setBatchResult("Something went wrong. Please try again.");
        return;
      }
      setBatchResult(
        data.added > 0
          ? `${data.added} post${data.added !== 1 ? "s" : ""} added as examples!`
          : "All posts are already examples."
      );
      fetchPosts();
    } catch {
      setBatchResult("Connection issue. Please try again.");
    } finally {
      setBatchAdding(false);
    }
  };

  const allFiltered = posts.filter((p) => {
    if (filter === "added") return p.addedToTraining;
    if (filter === "not-added") return !p.addedToTraining;
    return true;
  });
  const filtered = allFiltered.slice(0, visibleCount);

  const addedCount = posts.filter((p) => p.addedToTraining).length;
  const notAddedCount = posts.length - addedCount;

  return (
    <div className={selectedPost ? "mr-[480px]" : ""}>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">My Posts</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {posts.length === 0
              ? "Import your Instagram posts to get started."
              : `${posts.length} post${posts.length !== 1 ? "s" : ""} — ${addedCount} used as examples, ${notAddedCount} not yet used`}
          </p>
        </div>
        <button
          onClick={handleScrape}
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
          {scraping
            ? "Importing..."
            : posts.length === 0
              ? "Import my posts"
              : "Check for new posts"}
        </button>
      </div>

      {/* Result message */}
      {scrapeResult && (
        <div className="mb-4 rounded-lg border border-green-800 bg-green-950/50 p-3 text-sm text-green-200">
          {scrapeResult}
        </div>
      )}

      {/* Scrape error */}
      {scrapeError && (
        <div className="mb-4 rounded-lg border border-red-800 bg-red-950/50 p-3 text-sm text-red-200">
          {scrapeError}
        </div>
      )}

      {/* Batch result */}
      {batchResult && (
        <div className="mb-4 rounded-lg border border-green-800 bg-green-950/50 p-3 text-sm text-green-200">
          {batchResult}
        </div>
      )}

      {/* Filter tabs + batch button */}
      {posts.length > 0 && (
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex gap-1 rounded-lg bg-zinc-900 p-1">
            {(
              [
                { key: "all", label: `All (${posts.length})` },
                { key: "added", label: `Examples (${addedCount})` },
                { key: "not-added", label: `Not used yet (${notAddedCount})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === tab.key
                    ? "bg-zinc-700 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {notAddedCount > 0 && (
            <button
              onClick={handleBatchAdd}
              disabled={batchAdding}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-50"
            >
              {batchAdding
                ? "Adding..."
                : `Add all ${notAddedCount} as examples`}
            </button>
          )}
        </div>
      )}

      {/* Posts table */}
      {loading ? (
        <p className="text-sm text-zinc-400">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-zinc-400">
          {posts.length === 0
            ? "No posts yet. Import your Instagram posts above to get started."
            : "No posts match this filter."}
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
                  Description
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400">
                  Likes
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-zinc-400">
                  Status
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
                    {post.likesCount >= 0 ? post.likesCount.toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {post.addedToTraining ? (
                      <span className="inline-flex items-center rounded-full bg-green-900/30 px-2 py-0.5 text-xs text-green-400">
                        Example
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                        Not used yet
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
