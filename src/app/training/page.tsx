"use client";

import { useState } from "react";
import { InstagramImport } from "@/components/instagram-import";
import { TrainingForm } from "@/components/training-form";
import { TrainingList } from "@/components/training-list";

const TrainingPage = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey((k) => k + 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Training Data</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Import captions from Instagram or add them manually. You need at least
          10 examples to fine-tune.
        </p>
      </div>
      <InstagramImport onImported={refresh} />
      <hr className="border-zinc-800" />
      <TrainingForm onAdded={refresh} />
      <hr className="border-zinc-800" />
      <TrainingList refreshKey={refreshKey} />
    </div>
  );
};

export default TrainingPage;
