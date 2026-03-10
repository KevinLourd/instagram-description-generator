import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { writeFile, unlink, mkdir } from "fs/promises";
import path from "path";
import os from "os";
import {
  getTrainingExamples,
  addTrainingExample,
  removeTrainingExample,
  exportAsJsonl,
} from "@/lib/training-store";

const tmpDir = path.join(os.tmpdir(), "lincoln-test");
const tmpFile = path.join(tmpDir, "test-training-data.json");

const emptyData = JSON.stringify({ examples: [] });

beforeEach(async () => {
  await mkdir(tmpDir, { recursive: true });
  await writeFile(tmpFile, emptyData, "utf-8");
});

afterEach(async () => {
  try {
    await unlink(tmpFile);
  } catch {
    /* ignore */
  }
});

describe("getTrainingExamples", () => {
  it("returns empty array for fresh file", async () => {
    const examples = await getTrainingExamples(tmpFile);
    expect(examples).toEqual([]);
  });
});

describe("addTrainingExample", () => {
  it("adds an example to the file", async () => {
    const example = await addTrainingExample(
      {
        systemPrompt: "You are a caption writer.",
        userPrompt: "Beach sunset photo",
        assistantResponse: "Chasing sunsets forever",
      },
      tmpFile
    );

    expect(example.id).toBeDefined();
    expect(example.userPrompt).toBe("Beach sunset photo");
    expect(example.createdAt).toBeDefined();

    const all = await getTrainingExamples(tmpFile);
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(example.id);
  });
});

describe("removeTrainingExample", () => {
  it("removes an example by id", async () => {
    const example = await addTrainingExample(
      {
        systemPrompt: "sys",
        userPrompt: "prompt",
        assistantResponse: "caption",
      },
      tmpFile
    );

    const removed = await removeTrainingExample(example.id, tmpFile);
    expect(removed).toBe(true);

    const all = await getTrainingExamples(tmpFile);
    expect(all).toHaveLength(0);
  });

  it("returns false for non-existent id", async () => {
    const removed = await removeTrainingExample("non-existent", tmpFile);
    expect(removed).toBe(false);
  });
});

describe("exportAsJsonl", () => {
  it("exports examples in OpenAI JSONL chat format", async () => {
    await addTrainingExample(
      {
        systemPrompt: "You are a writer.",
        userPrompt: "Beach photo",
        assistantResponse: "Waves and wonder",
      },
      tmpFile
    );
    await addTrainingExample(
      {
        systemPrompt: "You are a writer.",
        userPrompt: "City night",
        assistantResponse: "Neon dreams",
      },
      tmpFile
    );

    const jsonl = await exportAsJsonl(tmpFile);
    const lines = jsonl.split("\n");
    expect(lines).toHaveLength(2);

    const first = JSON.parse(lines[0]);
    expect(first.messages).toHaveLength(3);
    expect(first.messages[0].role).toBe("system");
    expect(first.messages[1].role).toBe("user");
    expect(first.messages[1].content).toBe("Beach photo");
    expect(first.messages[2].role).toBe("assistant");
    expect(first.messages[2].content).toBe("Waves and wonder");
  });
});
