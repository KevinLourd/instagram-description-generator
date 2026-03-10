import { NextResponse } from "next/server";
import {
  getTrainingExamples,
  addTrainingExample,
  removeTrainingExample,
} from "@/lib/training-store";
import { addExampleSchema, deleteExampleSchema } from "@/lib/types";

export const GET = async () => {
  const examples = await getTrainingExamples();
  return NextResponse.json({ examples });
};

export const POST = async (request: Request) => {
  const body = await request.json();
  const parsed = addExampleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const example = await addTrainingExample(parsed.data);
  return NextResponse.json({ example }, { status: 201 });
};

export const DELETE = async (request: Request) => {
  const body = await request.json();
  const parsed = deleteExampleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const removed = await removeTrainingExample(parsed.data.id);
  if (!removed) {
    return NextResponse.json({ error: "Example not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
};
