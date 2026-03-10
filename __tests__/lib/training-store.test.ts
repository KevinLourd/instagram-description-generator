import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock("@/lib/db", () => ({ sql: mockSql, ensureTables: vi.fn() }));

import {
  getTrainingExamples,
  addTrainingExample,
  removeTrainingExample,
  exportAsJsonl,
} from "@/lib/training-store";

beforeEach(() => {
  mockSql.mockReset();
});

describe("getTrainingExamples", () => {
  it("returns empty array when no rows", async () => {
    mockSql.mockResolvedValue([]);
    const examples = await getTrainingExamples();
    expect(examples).toEqual([]);
  });

  it("maps database rows to TrainingExample objects", async () => {
    mockSql.mockResolvedValue([
      {
        id: "abc-123",
        system_prompt: "sys",
        user_prompt: "prompt",
        image_url: "https://example.com/photo.jpg",
        assistant_response: "response",
        created_at: new Date("2024-01-01T00:00:00Z"),
      },
    ]);
    const examples = await getTrainingExamples();
    expect(examples).toHaveLength(1);
    expect(examples[0]).toEqual({
      id: "abc-123",
      systemPrompt: "sys",
      userPrompt: "prompt",
      imageUrl: "https://example.com/photo.jpg",
      assistantResponse: "response",
      createdAt: "2024-01-01T00:00:00.000Z",
    });
  });
});

describe("addTrainingExample", () => {
  it("inserts and returns the new example", async () => {
    mockSql.mockResolvedValue([
      {
        id: "new-id",
        system_prompt: "You are a writer.",
        user_prompt: "Write a caption.",
        image_url: "https://example.com/beach.jpg",
        assistant_response: "Waves and wonder",
        created_at: new Date("2024-06-01T12:00:00Z"),
      },
    ]);

    const example = await addTrainingExample({
      systemPrompt: "You are a writer.",
      userPrompt: "Write a caption.",
      imageUrl: "https://example.com/beach.jpg",
      assistantResponse: "Waves and wonder",
    });

    expect(example.id).toBe("new-id");
    expect(example.imageUrl).toBe("https://example.com/beach.jpg");
    expect(example.createdAt).toBeDefined();
  });
});

describe("removeTrainingExample", () => {
  it("returns true when a row is deleted", async () => {
    mockSql.mockResolvedValue([{ id: "abc" }]);
    const removed = await removeTrainingExample("abc");
    expect(removed).toBe(true);
  });

  it("returns false for non-existent id", async () => {
    mockSql.mockResolvedValue([]);
    const removed = await removeTrainingExample("non-existent");
    expect(removed).toBe(false);
  });
});

describe("exportAsJsonl", () => {
  it("exports examples in OpenAI vision JSONL format", async () => {
    mockSql.mockResolvedValue([
      {
        id: "1",
        system_prompt: "You are a writer.",
        user_prompt: "Write a caption.",
        image_url: "https://example.com/beach.jpg",
        assistant_response: "Waves and wonder",
        created_at: new Date("2024-01-01"),
      },
      {
        id: "2",
        system_prompt: "You are a writer.",
        user_prompt: "Write a caption.",
        image_url: "https://example.com/city.jpg",
        assistant_response: "Neon dreams",
        created_at: new Date("2024-01-02"),
      },
    ]);

    const jsonl = await exportAsJsonl();
    const lines = jsonl.split("\n");
    expect(lines).toHaveLength(2);

    const first = JSON.parse(lines[0]);
    expect(first.messages).toHaveLength(3);
    expect(first.messages[0].role).toBe("system");
    expect(first.messages[1].role).toBe("user");
    expect(first.messages[1].content).toEqual([
      {
        type: "image_url",
        image_url: { url: "https://example.com/beach.jpg", detail: "low" },
      },
      {
        type: "text",
        text: "Write a caption.",
      },
    ]);
    expect(first.messages[2].role).toBe("assistant");
    expect(first.messages[2].content).toBe("Waves and wonder");
  });

  it("excludes examples without an image URL", async () => {
    mockSql.mockResolvedValue([
      {
        id: "1",
        system_prompt: "sys",
        user_prompt: "Write a caption.",
        image_url: "https://example.com/photo.jpg",
        assistant_response: "Caption 1",
        created_at: new Date("2024-01-01"),
      },
      {
        id: "2",
        system_prompt: "sys",
        user_prompt: "Old text example",
        image_url: "",
        assistant_response: "Caption 2",
        created_at: new Date("2024-01-02"),
      },
    ]);

    const jsonl = await exportAsJsonl();
    const lines = jsonl.split("\n");
    expect(lines).toHaveLength(1);
  });
});
