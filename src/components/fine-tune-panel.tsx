"use client";

import { useState, useEffect, useCallback } from "react";
import type { FineTuneJob } from "@/lib/types";

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
        setError(data.error ?? "Failed to start fine-tuning");
        return;
      }
      fetchJobs();
    } catch {
      setError("Network error");
    } finally {
      setStarting(false);
    }
  };

  const statusColor = (status: string) => {
    if (status === "succeeded") return "text-green-400";
    if (status === "failed" || status === "cancelled") return "text-red-400";
    return "text-yellow-400";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Fine-Tune</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Train a custom model on your Instagram captions. Requires at least 10
          training examples.
        </p>
      </div>

      <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4">
        <p className="text-sm text-zinc-300">
          Training examples: <strong>{exampleCount}</strong>
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Base model: gpt-4o-mini-2024-07-18
        </p>
        <button
          onClick={handleStart}
          disabled={starting || exampleCount < 10}
          className="mt-3 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {starting ? "Starting..." : "Start Fine-Tuning"}
        </button>
        {exampleCount < 10 && (
          <p className="mt-2 text-xs text-yellow-400">
            Add {10 - exampleCount} more example
            {10 - exampleCount !== 1 ? "s" : ""} to enable fine-tuning.
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/50 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading && jobs.length === 0 ? (
        <p className="text-sm text-zinc-400">Loading jobs...</p>
      ) : jobs.length === 0 ? (
        <p className="text-sm text-zinc-400">No fine-tuning jobs yet.</p>
      ) : (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Jobs</h2>
          {jobs.map((job) => (
            <div
              key={job.id}
              className="rounded-lg border border-zinc-700 bg-zinc-900 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-zinc-400">
                  {job.id}
                </span>
                <span className={`text-xs font-medium ${statusColor(job.status)}`}>
                  {job.status}
                </span>
              </div>
              {job.fine_tuned_model && (
                <p className="mt-2 text-sm text-green-300">
                  Model: {job.fine_tuned_model}
                </p>
              )}
              <p className="mt-1 text-xs text-zinc-500">
                Created:{" "}
                {new Date(job.created_at * 1000).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
