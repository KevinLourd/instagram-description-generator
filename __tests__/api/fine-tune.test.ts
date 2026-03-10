import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock training-store before importing the route
const mockGetTrainingExamples = vi.fn();
const mockExportAsJsonl = vi.fn();

vi.mock("@/lib/training-store", () => ({
  getTrainingExamples: mockGetTrainingExamples,
  exportAsJsonl: mockExportAsJsonl,
}));

vi.mock("@/lib/openai", () => ({
  getOpenAIClient: () => ({
    files: { create: vi.fn().mockResolvedValue({ id: "file-123" }) },
    fineTuning: {
      jobs: {
        create: vi.fn().mockResolvedValue({ id: "ftjob-123", status: "queued" }),
        list: vi.fn().mockResolvedValue({ data: [] }),
      },
    },
  }),
}));

describe("POST /api/fine-tune", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects when fewer than 10 examples have images", async () => {
    // 15 examples total but only 5 with images
    const examples = Array.from({ length: 15 }, (_, i) => ({
      id: `ex-${i}`,
      systemPrompt: "sys",
      userPrompt: "user",
      imageUrl: i < 5 ? "https://example.com/img.jpg" : "",
      assistantResponse: "response",
      createdAt: new Date().toISOString(),
    }));
    mockGetTrainingExamples.mockResolvedValue(examples);

    const { POST } = await import("@/app/api/fine-tune/route");
    const res = await POST();
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("with images");
    expect(data.error).toContain("5");
  });

  it("rejects when exportAsJsonl returns empty string", async () => {
    const examples = Array.from({ length: 10 }, (_, i) => ({
      id: `ex-${i}`,
      systemPrompt: "sys",
      userPrompt: "user",
      imageUrl: "https://example.com/img.jpg",
      assistantResponse: "response",
      createdAt: new Date().toISOString(),
    }));
    mockGetTrainingExamples.mockResolvedValue(examples);
    mockExportAsJsonl.mockResolvedValue("");

    const { POST } = await import("@/app/api/fine-tune/route");
    const res = await POST();
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("empty");
  });

  it("succeeds with 10+ examples that have images", async () => {
    const examples = Array.from({ length: 12 }, (_, i) => ({
      id: `ex-${i}`,
      systemPrompt: "sys",
      userPrompt: "user",
      imageUrl: "https://example.com/img.jpg",
      assistantResponse: "response",
      createdAt: new Date().toISOString(),
    }));
    mockGetTrainingExamples.mockResolvedValue(examples);
    mockExportAsJsonl.mockResolvedValue('{"messages":[]}\n{"messages":[]}');

    const { POST } = await import("@/app/api/fine-tune/route");
    const res = await POST();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.job.id).toBe("ftjob-123");
  });
});
