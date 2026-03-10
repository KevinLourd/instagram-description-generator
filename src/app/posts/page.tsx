"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import type { InstagramPost } from "@/lib/types";
import { PostDetailPanel } from "@/components/post-detail-panel";
import { extractUsername } from "@/lib/instagram";

const INSTAGRAM_USERNAME = extractUsername(
  process.env.NEXT_PUBLIC_INSTAGRAM_USERNAME ?? ""
);

type TrainingStatus = "idle" | "adding" | "fine-tuning" | "done" | "error";

const PostsPage = () => {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<InstagramPost | null>(null);

  const [scraping, setScraping] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [visibleCount, setVisibleCount] = useState(0);
  const staggerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Training progress state
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus>("idle");
  const [addingProgress, setAddingProgress] = useState({ current: 0, total: 0 });
  const [fineTuneJobId, setFineTuneJobId] = useState<string | null>(null);
  const [hasTrainedModel, setHasTrainedModel] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Check if there's an active, completed, or failed fine-tuning job on mount
  const checkJobStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/fine-tune");
      const data = await res.json();
      const jobs = data.jobs ?? [];
      const hasSucceeded = jobs.some((j: { status: string }) => j.status === "succeeded");
      setHasTrainedModel(hasSucceeded);

      // If there's a running job, resume polling
      const activeJob = jobs.find((j: { status: string }) =>
        j.status === "running" || j.status === "validating_files" || j.status === "queued"
      );
      if (activeJob) {
        setFineTuneJobId(activeJob.id);
        setTrainingStatus("fine-tuning");
        return;
      }

      // If the most recent job failed and there's no succeeded job, show error
      if (!hasSucceeded && jobs.length > 0) {
        const mostRecent = jobs[0] as { status: string; error?: { message?: string } };
        if (mostRecent.status === "failed" || mostRecent.status === "cancelled") {
          setTrainingStatus("error");
          setMessage({ type: "error", text: `Last training failed: ${mostRecent.error?.message ?? "Unknown error"}. Click "Retry training" to try again.` });
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    checkJobStatus();
  }, [fetchPosts, checkJobStatus]);

  // Poll fine-tuning job status
  useEffect(() => {
    if (trainingStatus !== "fine-tuning" || !fineTuneJobId) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/fine-tune/${fineTuneJobId}`);
        const data = await res.json();
        const status = data.job?.status;

        if (status === "succeeded") {
          setTrainingStatus("done");
          setHasTrainedModel(true);
          setFineTuneJobId(null);
          setMessage({ type: "success", text: "Training complete! Your style is ready. Go to Write a Caption to try it out." });
        } else if (status === "failed" || status === "cancelled") {
          setTrainingStatus("error");
          setFineTuneJobId(null);
          setMessage({ type: "error", text: "Training failed. Please try again." });
        }
      } catch {
        /* keep polling */
      }
    };

    poll(); // immediate check
    pollRef.current = setInterval(poll, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [trainingStatus, fineTuneJobId]);

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
      setMessage({ type: "success", text: "All posts are already in training." });
      return;
    }

    setTrainingStatus("adding");
    setMessage(null);
    setAddingProgress({ current: 0, total: notTrained.length });

    let added = 0;

    // Add posts one by one with visible progress
    for (const post of notTrained) {
      try {
        const res = await fetch(`/api/posts/${post.id}`, { method: "POST" });
        if (res.ok) added++;
      } catch {
        /* skip */
      }
      setAddingProgress((prev) => ({ ...prev, current: prev.current + 1 }));
      // Refresh the table so each row flips to "Training..." status
      await fetchPosts();
    }

    // Start fine-tuning
    try {
      const res = await fetch("/api/fine-tune", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.job?.id) {
        setFineTuneJobId(data.job.id);
        setTrainingStatus("fine-tuning");
      } else {
        setTrainingStatus("error");
        setMessage({
          type: "error",
          text: `${added} post${added !== 1 ? "s" : ""} added. ${data.error ?? "Could not start fine-tuning."}`,
        });
      }
    } catch {
      setTrainingStatus("error");
      setMessage({
        type: "error",
        text: `${added} post${added !== 1 ? "s" : ""} added. Could not start fine-tuning.`,
      });
    }
  };

  const handleRetryTraining = async () => {
    setTrainingStatus("fine-tuning");
    setMessage(null);
    try {
      const res = await fetch("/api/fine-tune", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.job?.id) {
        setFineTuneJobId(data.job.id);
      } else {
        setTrainingStatus("error");
        setMessage({ type: "error", text: data.error ?? "Could not start fine-tuning." });
      }
    } catch {
      setTrainingStatus("error");
      setMessage({ type: "error", text: "Could not start fine-tuning." });
    }
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
  const isTrainingBusy = trainingStatus === "adding" || trainingStatus === "fine-tuning";
  const isFineTuning = trainingStatus === "fine-tuning";

  const getPostStatus = (post: InstagramPost) => {
    if (!post.imageUrl) return "no-image";
    if (!post.addedToTraining) return "not-trained";
    if (isFineTuning) return "training";
    if (hasTrainedModel) return "trained";
    if (trainingStatus === "error") return "failed";
    return "training"; // added but no succeeded job yet
  };

  return (
    <div className={selectedPost ? "md:mr-[480px]" : ""}>
      {/* Training progress banner */}
      {trainingStatus === "adding" && (
        <div className="mb-4 rounded-lg border border-blue-800 bg-blue-950/50 p-4">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 animate-spin text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-200">
                Adding posts to training... {addingProgress.current}/{addingProgress.total}
              </p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-blue-900/50">
                <div
                  className="h-full rounded-full bg-blue-400 transition-all duration-300"
                  style={{ width: `${(addingProgress.current / addingProgress.total) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {trainingStatus === "fine-tuning" && (
        <div className="mb-4 rounded-lg border border-yellow-800 bg-yellow-950/50 p-4">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 animate-spin text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-yellow-200">
                Training in progress...
              </p>
              <p className="text-xs text-yellow-200/60">
                The AI is learning your style. This usually takes 10-30 minutes. You can leave this page — we&apos;ll keep checking.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Posts</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {posts.length === 0
              ? "Sync your Instagram posts to get started."
              : `${posts.length} post${posts.length !== 1 ? "s" : ""} — ${addedCount} in training, ${notAddedCount} ready to add`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {notAddedCount > 0 && !isTrainingBusy && (
            <button
              onClick={handleTrainAll}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m-6.063 16.658l.26-1.477m2.605-14.772l.26-1.477m0 17.726l-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205L12 12m6.894 5.785l-1.149-.964M6.256 7.178l-1.15-.964m15.352 8.864l-1.41-.513M4.954 9.435l-1.41-.514M12.002 12l-3.75 6.495" />
              </svg>
              Train {notAddedCount} new post{notAddedCount !== 1 ? "s" : ""}
            </button>
          )}
          {trainingStatus === "error" && addedCount > 0 && !isTrainingBusy && (
            <button
              onClick={handleRetryTraining}
              className="flex items-center gap-2 rounded-lg bg-yellow-600 px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
              Retry training
            </button>
          )}
          <button
            onClick={handleSync}
            disabled={scraping || !INSTAGRAM_USERNAME || isTrainingBusy}
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
      {loading && posts.length === 0 ? (
        <p className="text-sm text-zinc-400">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-zinc-400">
          No posts yet. Click &quot;Sync Instagram&quot; to import your posts.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full min-w-[500px]">
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
              {filtered.map((post) => {
                const status = getPostStatus(post);
                return (
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
                      {post.likesCount != null && post.likesCount >= 0 ? post.likesCount.toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {status === "trained" && (
                        <span className="inline-flex items-center rounded-full bg-green-900/30 px-2 py-0.5 text-xs text-green-400">
                          Trained
                        </span>
                      )}
                      {status === "training" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-900/30 px-2 py-0.5 text-xs text-yellow-400">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-400" />
                          Training...
                        </span>
                      )}
                      {status === "not-trained" && (
                        <span className="inline-flex items-center rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                          Not trained
                        </span>
                      )}
                      {status === "failed" && (
                        <span className="inline-flex items-center rounded-full bg-red-900/30 px-2 py-0.5 text-xs text-red-400">
                          Failed
                        </span>
                      )}
                      {status === "no-image" && (
                        <span className="inline-flex items-center rounded-full bg-orange-900/30 px-2 py-0.5 text-xs text-orange-400">
                          No image
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
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
