"use client";

import { useState, useEffect, useCallback } from "react";
import type { TrainingExample } from "@/lib/types";

type Props = {
  readonly refreshKey: number;
};

export const TrainingList = ({ refreshKey }: Props) => {
  const [examples, setExamples] = useState<TrainingExample[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExamples = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/training");
      const data = await res.json();
      setExamples(data.examples);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExamples();
  }, [fetchExamples, refreshKey]);

  const handleDelete = async (id: string) => {
    await fetch("/api/training", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchExamples();
  };

  if (loading) {
    return <p className="text-sm text-zinc-400">Loading...</p>;
  }

  if (examples.length === 0) {
    return (
      <p className="text-sm text-zinc-400">
        No training examples yet. Add at least 10 to fine-tune a model.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-400">
        {examples.length} example{examples.length !== 1 ? "s" : ""}{" "}
        {examples.length < 10 && (
          <span className="text-yellow-400">
            (need at least 10 for fine-tuning)
          </span>
        )}
      </p>
      {examples.map((ex) => (
        <div
          key={ex.id}
          className="rounded-lg border border-zinc-700 bg-zinc-900 p-4"
        >
          <div className="mb-2 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-zinc-500">Prompt</p>
              <p className="truncate text-sm text-zinc-300">{ex.userPrompt}</p>
            </div>
            <button
              onClick={() => handleDelete(ex.id)}
              className="shrink-0 text-xs text-zinc-500 hover:text-red-400"
            >
              Delete
            </button>
          </div>
          <p className="text-xs text-zinc-500">Caption</p>
          <p className="line-clamp-3 text-sm text-white">
            {ex.assistantResponse}
          </p>
        </div>
      ))}
    </div>
  );
};
