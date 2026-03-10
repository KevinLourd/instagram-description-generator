"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
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
        No examples yet. Import posts from{" "}
        <a href="/posts" className="text-white underline">
          My Posts
        </a>{" "}
        or add some by hand above.
      </p>
    );
  }

  const withImage = examples.filter((ex) => ex.imageUrl);
  const withoutImage = examples.filter((ex) => !ex.imageUrl);

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-400">
        {examples.length} example{examples.length !== 1 ? "s" : ""}
        {withoutImage.length > 0 && (
          <span className="text-orange-400">
            {" "}
            — {withoutImage.length} without image (will be excluded from training)
          </span>
        )}
        {withImage.length < 10 && (
          <span className="text-yellow-400">
            {" "}
            — you need at least 10 image examples to start learning your style
          </span>
        )}
        {withImage.length >= 10 && (
          <span className="text-green-400">
            {" "}
            — ready to{" "}
            <a href="/fine-tune" className="underline">
              learn your style
            </a>
          </span>
        )}
      </p>
      {examples.map((ex) => (
        <div
          key={ex.id}
          className="rounded-lg border border-zinc-700 bg-zinc-900 p-4"
        >
          <div className="mb-2 flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-1 gap-3">
              {ex.imageUrl ? (
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-zinc-700">
                  <Image
                    src={ex.imageUrl}
                    alt="Training example"
                    fill
                    sizes="56px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-orange-800 bg-orange-950/30">
                  <span className="text-xs text-orange-400">No img</span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs text-zinc-500">Caption</p>
                <p className="line-clamp-2 text-sm text-white">
                  {ex.assistantResponse}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleDelete(ex.id)}
              className="shrink-0 text-xs text-zinc-500 hover:text-red-400"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
