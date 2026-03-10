"use client";

import { useState } from "react";
import type { InstagramPost } from "@/lib/types";

const DEFAULT_SYSTEM_PROMPT =
  "You are an expert Instagram caption writer. Write engaging, authentic captions that match the style and tone of this account.";

type Props = {
  readonly onImported: () => void;
};

export const InstagramImport = ({ onImported }: Props) => {
  const [username, setUsername] = useState("");
  const [limit, setLimit] = useState(50);
  const [scraping, setScraping] = useState(false);
  const [importing, setImporting] = useState(false);
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");
  const [step, setStep] = useState<"input" | "select">("input");

  const handleScrape = async () => {
    if (!username.trim()) return;
    setScraping(true);
    setError("");
    setPosts([]);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.replace("@", "").trim(),
          resultsLimit: limit,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          typeof data.error === "string" ? data.error : JSON.stringify(data.error)
        );
        return;
      }
      if (data.posts.length === 0) {
        setError("No posts with captions found for this profile.");
        return;
      }
      setPosts(data.posts);
      setSelected(new Set(data.posts.map((_: InstagramPost, i: number) => i)));
      setStep("select");
    } catch {
      setError("Network error while scraping");
    } finally {
      setScraping(false);
    }
  };

  const toggleSelect = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === posts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(posts.map((_, i) => i)));
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setError("");
    try {
      const selectedPosts = posts.filter((_, i) => selected.has(i));
      for (const post of selectedPosts) {
        const userPrompt = post.imageUrl
          ? `Instagram post image: ${post.imageUrl}`
          : "Instagram post";

        await fetch("/api/training", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemPrompt: DEFAULT_SYSTEM_PROMPT,
            userPrompt,
            assistantResponse: post.caption,
          }),
        });
      }
      setPosts([]);
      setSelected(new Set());
      setStep("input");
      setUsername("");
      onImported();
    } catch {
      setError("Failed to import some posts");
    } finally {
      setImporting(false);
    }
  };

  if (step === "select") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            Select posts to import ({selected.size}/{posts.length})
          </h2>
          <div className="flex gap-2">
            <button
              onClick={toggleAll}
              className="text-xs text-zinc-400 hover:text-white"
            >
              {selected.size === posts.length ? "Deselect all" : "Select all"}
            </button>
            <button
              onClick={() => {
                setStep("input");
                setPosts([]);
              }}
              className="text-xs text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>

        <div className="max-h-96 space-y-2 overflow-y-auto">
          {posts.map((post, i) => (
            <label
              key={i}
              className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors ${
                selected.has(i)
                  ? "border-white/30 bg-zinc-800"
                  : "border-zinc-700 bg-zinc-900 opacity-50"
              }`}
            >
              <input
                type="checkbox"
                checked={selected.has(i)}
                onChange={() => toggleSelect(i)}
                className="mt-1 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm text-white">
                  {post.caption}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {post.likesCount} likes
                  {post.timestamp &&
                    ` · ${new Date(post.timestamp).toLocaleDateString()}`}
                </p>
              </div>
              {post.imageUrl && (
                <img
                  src={post.imageUrl}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded object-cover"
                />
              )}
            </label>
          ))}
        </div>

        {error && <div className="text-sm text-red-400">{error}</div>}

        <button
          onClick={handleImport}
          disabled={importing || selected.size === 0}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {importing
            ? `Importing ${selected.size} posts...`
            : `Import ${selected.size} post${selected.size !== 1 ? "s" : ""} as training data`}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">
          Import from Instagram
        </h2>
        <p className="mt-1 text-xs text-zinc-400">
          Scrape posts from a public Instagram profile using Apify.
        </p>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Instagram username (e.g. hasti.salar1)"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500"
          />
        </div>
        <div className="w-24">
          <input
            type="number"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            min={1}
            max={200}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
          />
          <p className="mt-0.5 text-center text-xs text-zinc-500">max posts</p>
        </div>
      </div>

      {error && <div className="text-sm text-red-400">{error}</div>}

      <button
        onClick={handleScrape}
        disabled={scraping || !username.trim()}
        className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {scraping ? "Scraping Instagram... (this may take a minute)" : "Scrape Posts"}
      </button>
    </div>
  );
};
