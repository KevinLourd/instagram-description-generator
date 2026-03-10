"use client";

import { useState } from "react";
import Image from "next/image";

const DEFAULT_SYSTEM_PROMPT =
  "You are an expert Instagram caption writer. Write engaging, authentic captions that match the style and tone of this account.";

type Props = {
  readonly onAdded: () => void;
};

export const TrainingForm = ({ onAdded }: Props) => {
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [imageUrl, setImageUrl] = useState("");
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
        body: JSON.stringify({
          systemPrompt,
          userPrompt: "Write an Instagram caption for this photo.",
          imageUrl,
          assistantResponse,
        }),
      });
      if (!res.ok) {
        setError("Could not add this example. Please try again.");
        return;
      }
      setImageUrl("");
      setAssistantResponse("");
      onAdded();
    } catch {
      setError("Connection issue. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isValidUrl = imageUrl.startsWith("http://") || imageUrl.startsWith("https://");

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Add an example by hand</h2>

      <div>
        <label className="mb-1 block text-sm text-zinc-300">
          Image URL
        </label>
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://example.com/photo.jpg"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500"
        />
        {isValidUrl && (
          <div className="relative mt-2 aspect-square w-full max-w-[160px] overflow-hidden rounded-lg border border-zinc-700">
            <Image
              src={imageUrl}
              alt="Preview"
              fill
              sizes="160px"
              className="object-cover"
              unoptimized
            />
          </div>
        )}
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
        disabled={loading || !isValidUrl || !assistantResponse.trim()}
        className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Adding..." : "Add this example"}
      </button>
    </form>
  );
};
