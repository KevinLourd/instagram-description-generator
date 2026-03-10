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
  const [showAdvanced, setShowAdvanced] = useState(false);

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
        setError("Could not add this example. Please try again.");
        return;
      }
      setUserPrompt("");
      setAssistantResponse("");
      onAdded();
    } catch {
      setError("Connection issue. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Add an example by hand</h2>

      <div>
        <label className="mb-1 block text-sm text-zinc-300">
          What is the photo about?
        </label>
        <textarea
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          placeholder="Ex: Sunset at the beach, summer vacation..."
          rows={2}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-zinc-300">
          The caption you would write for it
        </label>
        <textarea
          value={assistantResponse}
          onChange={(e) => setAssistantResponse(e.target.value)}
          placeholder="Paste or write the Instagram caption here..."
          rows={3}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500"
        />
      </div>

      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-xs text-zinc-500 hover:text-zinc-300"
      >
        {showAdvanced ? "Hide advanced" : "Advanced options"}
      </button>

      {showAdvanced && (
        <div>
          <label className="mb-1 block text-sm text-zinc-300">
            Instructions for the AI
          </label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
          />
        </div>
      )}

      {error && <div className="text-sm text-red-400">{error}</div>}

      <button
        type="submit"
        disabled={loading || !userPrompt.trim() || !assistantResponse.trim()}
        className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Adding..." : "Add this example"}
      </button>
    </form>
  );
};
