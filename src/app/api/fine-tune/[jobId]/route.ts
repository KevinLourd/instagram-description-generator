import { NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) => {
  const { jobId } = await params;
  const openai = getOpenAIClient();
  const job = await openai.fineTuning.jobs.retrieve(jobId);
  return NextResponse.json({ job });
};
