"use client";

import { useState, useEffect, useCallback } from "react";
import type { FineTuneJob } from "@/lib/types";

const statusLabel = (status: string) => {
  if (status === "succeeded") return "Ready";
  if (status === "failed") return "Failed";
  if (status === "cancelled") return "Cancelled";
  if (status === "running" || status === "validating_files") return "In progress...";
  return "Starting...";
};

const statusColor = (status: string) => {
  if (status === "succeeded") return "text-green-400";
  if (status === "failed" || status === "cancelled") return "text-red-400";
  return "text-yellow-400";
};

export const FineTunePanel = () => {
  const [jobs, setJobs] = useState<FineTuneJob[]>([]);
  const [exampleCount, setExampleCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const [jobsRes, trainingRes] = await Promise.all([
        fetch("/api/fine-tune"),
        fetch("/api/training"),
      ]);
      const jobsData = await jobsRes.json();
      const trainingData = await trainingRes.json();
      setJobs(jobsData.jobs ?? []);
      setExampleCount(trainingData.examples?.length ?? 0);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 15000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  const handleStart = async () => {
    setStarting(true);
    setError("");
    try {
      const res = await fetch("/api/fine-tune", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      fetchJobs();
    } catch {
      setError("Connection issue. Please try again.");
    } finally {
      setStarting(false);
    }
  };

  const hasSucceeded = jobs.some((j) => j.status === "succeeded");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Learn My Style</h1>
        <p className="mt-1 text-sm text-zinc-400">
          The AI will study your examples and learn to write like you.
          {" "}This usually takes 10 to 30 minutes.
        </p>
      </div>

      <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4">
        <p className="text-sm text-zinc-300">
          Examples available: <strong>{exampleCount}</strong>
        </p>
        {exampleCount < 10 ? (
          <p className="mt-2 text-sm text-yellow-400">
            You need at least 10 examples. Go to{" "}
            <a href="/posts" className="underline">
              My Posts
            </a>{" "}
            to mark more posts as examples ({10 - exampleCount} more needed).
          </p>
        ) : (
          <button
            onClick={handleStart}
            disabled={starting}
            className="mt-3 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {starting ? "Starting..." : "Start learning"}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/50 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading && jobs.length === 0 ? (
        <p className="text-sm text-zinc-400">Loading...</p>
      ) : jobs.length === 0 ? (
        <p className="text-sm text-zinc-400">
          No learning sessions yet. Add your examples and start above.
        </p>
      ) : (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">History</h2>
          {jobs.map((job) => (
            <div
              key={job.id}
              className="rounded-lg border border-zinc-700 bg-zinc-900 p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-300">
                  {new Date(job.created_at * 1000).toLocaleDateString()} —{" "}
                  {new Date(job.created_at * 1000).toLocaleTimeString()}
                </p>
                <span
                  className={`text-xs font-medium ${statusColor(job.status)}`}
                >
                  {statusLabel(job.status)}
                </span>
              </div>
              {job.fine_tuned_model && (
                <p className="mt-2 text-sm text-green-300">
                  Your style has been learned! You can now{" "}
                  <a href="/" className="underline">
                    write captions
                  </a>
                  .
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {hasSucceeded && (
        <div className="rounded-lg border border-green-800 bg-green-950/50 p-4 text-sm text-green-200">
          Your style is ready! Go to{" "}
          <a href="/" className="underline font-medium">
            Write a Caption
          </a>{" "}
          to create your first description.
        </div>
      )}
    </div>
  );
};
