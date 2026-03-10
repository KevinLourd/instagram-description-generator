import { NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";
import { exportAsJsonl, getTrainingExamples } from "@/lib/training-store";

export const POST = async () => {
  const examples = await getTrainingExamples();
  const withImages = examples.filter((e) => e.imageBase64);
  if (withImages.length < 10) {
    return NextResponse.json(
      {
        error: `Need at least 10 training examples with images, currently have ${withImages.length}`,
      },
      { status: 400 }
    );
  }

  const openai = getOpenAIClient();
  const jsonl = await exportAsJsonl();
  if (!jsonl.trim()) {
    return NextResponse.json(
      { error: "Training file is empty. No valid examples found." },
      { status: 400 }
    );
  }
  const blob = new Blob([jsonl], { type: "application/jsonl" });
  const file = new File([blob], "training-data.jsonl", {
    type: "application/jsonl",
  });

  const uploadedFile = await openai.files.create({
    file,
    purpose: "fine-tune",
  });

  const job = await openai.fineTuning.jobs.create({
    training_file: uploadedFile.id,
    model: "gpt-4o-2024-08-06",
  });

  return NextResponse.json({ job });
};

export const GET = async () => {
  const openai = getOpenAIClient();
  const jobs = await openai.fineTuning.jobs.list({ limit: 20 });
  return NextResponse.json({ jobs: jobs.data });
};
