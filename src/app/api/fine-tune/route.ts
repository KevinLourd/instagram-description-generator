import { NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";
import { exportAsJsonl, getTrainingExamples } from "@/lib/training-store";

export const POST = async () => {
  const examples = await getTrainingExamples();
  if (examples.length < 10) {
    return NextResponse.json(
      {
        error: `Need at least 10 training examples, currently have ${examples.length}`,
      },
      { status: 400 }
    );
  }

  const openai = getOpenAIClient();
  const jsonl = await exportAsJsonl();
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
    model: "gpt-4.1-2025-04-14",
  });

  return NextResponse.json({ job });
};

export const GET = async () => {
  const openai = getOpenAIClient();
  const jobs = await openai.fineTuning.jobs.list({ limit: 20 });
  return NextResponse.json({ jobs: jobs.data });
};
