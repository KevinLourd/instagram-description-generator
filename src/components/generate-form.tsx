"use client";

import { useState, useEffect } from "react";

type Job = {
  id: string;
  status: string;
  fine_tuned_model: string | null;
};

export const GenerateForm = () => {
  const [prompt, setPrompt] = useState("");
  const [modelId, setModelId] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch("/api/fine-tune");
        const data = await res.json();
        const succeeded = (data.jobs as Job[])
          .filter((j) => j.status === "succeeded" && j.fine_tuned_model)
          .map((j) => j.fine_tuned_model as string);
        setModels(succeeded);
        if (succeeded.length > 0 && !modelId) {
          setModelId(succeeded[0]);
        }
      } catch {
        /* ignore */
      }
    };
    fetchModels();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGenerate = async () => {
    if (!prompt.trim() || !modelId) return;
    setLoading(true);
    setError("");
    setCaption("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, modelId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong, please try again.");
        return;
      }
      setCaption(data.caption);
    } catch {
      setError("Connection issue. Please check your internet and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Write a Caption</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Describe your photo and get a caption written in your style, Hasti.
        </p>
      </div>

      {models.length === 0 ? (
        <div className="rounded-lg border border-yellow-800 bg-yellow-950/50 p-4 text-sm text-yellow-200">
          Your style hasn&apos;t been learned yet. Here&apos;s what to do, Hasti:
          <ol className="mt-2 list-inside list-decimal space-y-1">
            <li>
              Go to{" "}
              <a href="/posts" className="underline">
                My Posts
              </a>{" "}
              and import your Instagram posts
            </li>
            <li>
              Mark at least 10 posts as examples in{" "}
              <a href="/training" className="underline">
                My Examples
              </a>
            </li>
            <li>
              Go to{" "}
              <a href="/fine-tune" className="underline">
                Learn My Style
              </a>{" "}
              and start the learning process
            </li>
          </ol>
        </div>
      ) : (
        <>
          {models.length > 1 && (
            <div>
              <label className="mb-1 block text-sm text-zinc-300">
                Which style to use
              </label>
              <select
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
              >
                {models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm text-zinc-300">
              Describe your photo
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Photo of a sunset at the beach, summer vibes, feeling grateful..."
              rows={3}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Writing..." : "Write My Caption"}
          </button>
        </>
      )}

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/50 p-4 text-sm text-red-200">
          {typeof error === "string" ? error : "Something went wrong. Please try again."}
        </div>
      )}

      {caption && (
        <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-zinc-400">Your new caption</span>
            <button
              onClick={handleCopy}
              className="text-xs text-zinc-400 hover:text-white"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="whitespace-pre-wrap text-sm text-white">{caption}</p>
        </div>
      )}
    </div>
  );
};
