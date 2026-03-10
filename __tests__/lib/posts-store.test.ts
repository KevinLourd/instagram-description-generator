import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock("@/lib/db", () => ({ sql: mockSql }));

import {
  getScrapedPosts,
  addScrapedPosts,
  markAsTraining,
  getPostById,
} from "@/lib/posts-store";

beforeEach(() => {
  mockSql.mockReset();
});

const sampleRow = {
  id: "post-1",
  caption: "Beach vibes",
  image_url: "https://img.com/1.jpg",
  timestamp: "2024-01-01",
  likes_count: 100,
  url: "https://instagram.com/p/1",
  added_to_training: false,
};

describe("getScrapedPosts", () => {
  it("returns empty array when no rows", async () => {
    mockSql.mockResolvedValue([]);
    const posts = await getScrapedPosts();
    expect(posts).toEqual([]);
  });

  it("maps database rows to InstagramPost objects", async () => {
    mockSql.mockResolvedValue([sampleRow]);
    const posts = await getScrapedPosts();
    expect(posts).toHaveLength(1);
    expect(posts[0]).toEqual({
      id: "post-1",
      caption: "Beach vibes",
      imageUrl: "https://img.com/1.jpg",
      timestamp: "2024-01-01",
      likesCount: 100,
      url: "https://instagram.com/p/1",
      addedToTraining: false,
    });
  });
});

describe("addScrapedPosts", () => {
  it("inserts posts and returns added ones", async () => {
    mockSql.mockResolvedValue([sampleRow]);

    const added = await addScrapedPosts([
      {
        caption: "Beach vibes",
        imageUrl: "https://img.com/1.jpg",
        timestamp: "2024-01-01",
        likesCount: 100,
        url: "https://instagram.com/p/1",
      },
    ]);

    expect(added).toHaveLength(1);
    expect(added[0].id).toBe("post-1");
    expect(added[0].addedToTraining).toBe(false);
  });

  it("returns empty array for duplicate urls (ON CONFLICT DO NOTHING)", async () => {
    mockSql.mockResolvedValue([]);

    const added = await addScrapedPosts([
      {
        caption: "Duplicate",
        imageUrl: "",
        timestamp: "",
        likesCount: 20,
        url: "https://instagram.com/p/abc",
      },
    ]);

    expect(added).toHaveLength(0);
  });

  it("returns empty array when given empty input", async () => {
    const added = await addScrapedPosts([]);
    expect(added).toEqual([]);
    expect(mockSql).not.toHaveBeenCalled();
  });
});

describe("markAsTraining", () => {
  it("marks a post and returns it", async () => {
    mockSql.mockResolvedValue([{ ...sampleRow, added_to_training: true }]);
    const result = await markAsTraining("post-1");
    expect(result).not.toBeNull();
    expect(result!.addedToTraining).toBe(true);
  });

  it("returns null for non-existent post", async () => {
    mockSql.mockResolvedValue([]);
    const result = await markAsTraining("non-existent");
    expect(result).toBeNull();
  });
});

describe("getPostById", () => {
  it("returns the post when found", async () => {
    mockSql.mockResolvedValue([sampleRow]);
    const post = await getPostById("post-1");
    expect(post).not.toBeNull();
    expect(post!.id).toBe("post-1");
  });

  it("returns null when not found", async () => {
    mockSql.mockResolvedValue([]);
    const post = await getPostById("missing");
    expect(post).toBeNull();
  });
});
