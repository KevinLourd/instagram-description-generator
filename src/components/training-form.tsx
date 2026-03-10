"use client";

import { useState } from "react";

const DEFAULT_SYSTEM_PROMPT =
  "You are an expert Instagram caption writer. Write engaging, authentic captions that match the style and tone of this account.";

type Props = {
  readonly onAdded: () => void;
};

export const TrainingForm = ({ onAdded }: Props) => {
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [userPrompt, setUserPrompt] = useState("");
  const [assistantResponse, setAssistantResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemPrompt, userPrompt, assistantResponse }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ? JSON.stringify(data.error) : "Failed to add");
        return;
      }
      setUserPrompt("");
      setAssistantResponse("");
      onAdded();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm text-zinc-300">
          System Prompt
        </label>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-zinc-300">
          Context / Prompt (what the user would describe about the photo)
        </label>
        <textarea
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          placeholder="e.g. Photo of a sunset at the beach, summer vibes"
          rows={2}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-zinc-300">
          Ideal Caption (the actual Instagram caption)
        </label>
        <textarea
          value={assistantResponse}
          onChange={(e) => setAssistantResponse(e.target.value)}
          placeholder="Paste the real Instagram caption here"
          rows={3}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500"
        />
      </div>

      {error && (
        <div className="text-sm text-red-400">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading || !userPrompt.trim() || !assistantResponse.trim()}
        className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Adding..." : "Add Example"}
      </button>
    </form>
  );
};
