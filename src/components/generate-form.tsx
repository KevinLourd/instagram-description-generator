"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

type Job = {
  id: string;
  status: string;
  fine_tuned_model: string | null;
};

const SAMPLE_PHOTOS = [
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600",
  "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=600",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600",
];

const pickRandom = (count: number) => {
  const shuffled = [...SAMPLE_PHOTOS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

export const GenerateForm = () => {
  const [imageUrl, setImageUrl] = useState("");
  const [modelId, setModelId] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [samples, setSamples] = useState<string[]>([]);

  useEffect(() => {
    setSamples(pickRandom(3));
  }, []);

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

  const handleGenerate = useCallback(async () => {
    if (!imageUrl.trim() || !modelId) return;
    setLoading(true);
    setError("");
    setCaption("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, modelId }),
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
  }, [imageUrl, modelId]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShuffle = () => {
    setSamples(pickRandom(3));
  };

  const isValidUrl = imageUrl.startsWith("http://") || imageUrl.startsWith("https://");

  if (models.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md rounded-lg border border-yellow-800 bg-yellow-950/50 p-6 text-sm text-yellow-200">
          <p className="mb-3 text-base font-semibold text-yellow-100">
            Your style hasn&apos;t been learned yet
          </p>
          <ol className="list-inside list-decimal space-y-2">
            <li>
              Go to{" "}
              <a href="/posts" className="font-medium text-white underline">
                My Posts
              </a>{" "}
              and sync your Instagram
            </li>
            <li>
              Click &quot;Train&quot; to teach the AI your style
            </li>
            <li>Come back here to generate captions</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] gap-8">
      {/* Left side — photo input */}
      <div className="flex w-1/2 flex-col">
        <h1 className="text-2xl font-bold text-white">Write a Caption</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Upload a photo and get a caption in your style, Hasti.
        </p>

        {models.length > 1 && (
          <div className="mt-4">
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

        <div className="mt-4">
          <label className="mb-1 block text-sm text-zinc-300">
            Paste a photo URL
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => { setImageUrl(e.target.value); setCaption(""); }}
            placeholder="https://example.com/my-photo.jpg"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500"
          />
        </div>

        {/* Image preview */}
        {isValidUrl && (
          <div className="relative mt-4 aspect-square w-full max-w-[320px] overflow-hidden rounded-xl border border-zinc-700">
            <Image
              src={imageUrl}
              alt="Your photo"
              fill
              sizes="320px"
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        {/* Sample photos */}
        <div className="mt-6">
          <div className="flex items-center gap-2">
            <p className="text-xs text-zinc-500">Or try a sample photo</p>
            <button
              onClick={handleShuffle}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3.5 w-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
            </button>
          </div>
          <div className="mt-2 flex gap-2">
            {samples.map((url) => (
              <button
                key={url}
                onClick={() => { setImageUrl(url); setCaption(""); }}
                className={`relative h-20 w-20 overflow-hidden rounded-lg border-2 transition-all ${
                  imageUrl === url ? "border-white" : "border-zinc-700 hover:border-zinc-500"
                }`}
              >
                <Image
                  src={url}
                  alt="Sample"
                  fill
                  sizes="80px"
                  className="object-cover"
                  unoptimized
                />
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !isValidUrl}
          className="mt-6 w-fit rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Writing..." : "Generate Caption"}
        </button>
      </div>

      {/* Right side — caption output */}
      <div className="flex w-1/2 flex-col">
        <h2 className="text-lg font-semibold text-white">Your Caption</h2>

        {error && (
          <div className="mt-4 rounded-lg border border-red-800 bg-red-950/50 p-4 text-sm text-red-200">
            {typeof error === "string" ? error : "Something went wrong. Please try again."}
          </div>
        )}

        {!caption && !error && !loading && (
          <div className="mt-4 flex flex-1 items-center justify-center rounded-xl border border-dashed border-zinc-700 p-8">
            <p className="text-center text-sm text-zinc-500">
              Select a photo and click &quot;Generate Caption&quot; to see your caption here.
            </p>
          </div>
        )}

        {loading && (
          <div className="mt-4 flex flex-1 items-center justify-center rounded-xl border border-zinc-700 p-8">
            <div className="flex items-center gap-3 text-sm text-zinc-400">
              <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Writing your caption...
            </div>
          </div>
        )}

        {caption && (
          <div className="mt-4 rounded-xl border border-zinc-700 bg-zinc-900 p-6">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-white">
              {caption}
            </p>
            <button
              onClick={handleCopy}
              className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90"
            >
              {copied ? "Copied!" : "Copy to clipboard"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
