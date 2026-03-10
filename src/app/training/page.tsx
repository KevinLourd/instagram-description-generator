"use client";

import { useState } from "react";
import { TrainingForm } from "@/components/training-form";
import { TrainingList } from "@/components/training-list";

const TrainingPage = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Training Data</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Add examples of Instagram captions to train your model. You need at
          least 10 examples.
        </p>
      </div>
      <TrainingForm onAdded={() => setRefreshKey((k) => k + 1)} />
      <hr className="border-zinc-800" />
      <TrainingList refreshKey={refreshKey} />
    </div>
  );
};

export default TrainingPage;
