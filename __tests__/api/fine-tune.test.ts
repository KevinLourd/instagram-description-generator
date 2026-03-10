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

const makeExample = (i: number, hasBase64: boolean) => ({
  id: `ex-${i}`,
  systemPrompt: "sys",
  userPrompt: "user",
  imageUrl: "https://example.com/img.jpg",
  imageBase64: hasBase64 ? "data:image/jpeg;base64,abc" : "",
  assistantResponse: "response",
  createdAt: new Date().toISOString(),
});

describe("POST /api/fine-tune", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects when fewer than 10 examples have base64 images", async () => {
    const examples = Array.from({ length: 15 }, (_, i) => makeExample(i, i < 5));
    mockGetTrainingExamples.mockResolvedValue(examples);

    const { POST } = await import("@/app/api/fine-tune/route");
    const res = await POST();
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("with images");
    expect(data.error).toContain("5");
  });

  it("rejects when exportAsJsonl returns empty string", async () => {
    const examples = Array.from({ length: 10 }, (_, i) => makeExample(i, true));
    mockGetTrainingExamples.mockResolvedValue(examples);
    mockExportAsJsonl.mockResolvedValue("");

    const { POST } = await import("@/app/api/fine-tune/route");
    const res = await POST();
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("empty");
  });

  it("succeeds with 10+ examples that have base64 images", async () => {
    const examples = Array.from({ length: 12 }, (_, i) => makeExample(i, true));
    mockGetTrainingExamples.mockResolvedValue(examples);
    mockExportAsJsonl.mockResolvedValue('{"messages":[]}\n{"messages":[]}');

    const { POST } = await import("@/app/api/fine-tune/route");
    const res = await POST();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.job.id).toBe("ftjob-123");
  });
});
