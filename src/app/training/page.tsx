"use client";

import { useState } from "react";
import { TrainingForm } from "@/components/training-form";
import { TrainingList } from "@/components/training-list";

const TrainingPage = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey((k) => k + 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">My Examples</h1>
        <p className="mt-1 text-sm text-zinc-400">
          These are the captions the AI will learn from. You can import posts
          from{" "}
          <a href="/posts" className="text-white underline">
            My Posts
          </a>
          , or add examples by hand below.
        </p>
      </div>
      <TrainingForm onAdded={refresh} />
      <hr className="border-zinc-800" />
      <TrainingList refreshKey={refreshKey} />
    </div>
  );
};

export default TrainingPage;
