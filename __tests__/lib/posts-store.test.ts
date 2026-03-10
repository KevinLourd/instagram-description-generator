import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { writeFile, unlink, mkdir } from "fs/promises";
import path from "path";
import os from "os";
import {
  getScrapedPosts,
  addScrapedPosts,
  markAsTraining,
  getPostById,
} from "@/lib/posts-store";

const tmpDir = path.join(os.tmpdir(), "lincoln-test-posts");
const tmpFile = path.join(tmpDir, "test-scraped-posts.json");

const emptyData = JSON.stringify({ posts: [] });

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

describe("getScrapedPosts", () => {
  it("returns empty array for fresh file", async () => {
    const posts = await getScrapedPosts(tmpFile);
    expect(posts).toEqual([]);
  });
});

describe("addScrapedPosts", () => {
  it("adds posts with id and addedToTraining=false", async () => {
    const added = await addScrapedPosts(
      [
        {
          caption: "Beach vibes",
          imageUrl: "https://img.com/1.jpg",
          timestamp: "2024-01-01",
          likesCount: 100,
          url: "https://instagram.com/p/1",
        },
      ],
      tmpFile
    );

    expect(added).toHaveLength(1);
    expect(added[0].id).toBeDefined();
    expect(added[0].addedToTraining).toBe(false);

    const all = await getScrapedPosts(tmpFile);
    expect(all).toHaveLength(1);
  });

  it("deduplicates by url", async () => {
    await addScrapedPosts(
      [
        {
          caption: "First",
          imageUrl: "",
          timestamp: "",
          likesCount: 10,
          url: "https://instagram.com/p/abc",
        },
      ],
      tmpFile
    );
    const second = await addScrapedPosts(
      [
        {
          caption: "Duplicate",
          imageUrl: "",
          timestamp: "",
          likesCount: 20,
          url: "https://instagram.com/p/abc",
        },
      ],
      tmpFile
    );

    expect(second).toHaveLength(0);
    const all = await getScrapedPosts(tmpFile);
    expect(all).toHaveLength(1);
    expect(all[0].caption).toBe("First");
  });
});

describe("markAsTraining", () => {
  it("marks a post as added to training", async () => {
    const added = await addScrapedPosts(
      [
        {
          caption: "Test",
          imageUrl: "",
          timestamp: "",
          likesCount: 5,
          url: "https://instagram.com/p/test",
        },
      ],
      tmpFile
    );

    const result = await markAsTraining(added[0].id, tmpFile);
    expect(result).not.toBeNull();

    const post = await getPostById(added[0].id, tmpFile);
    expect(post?.addedToTraining).toBe(true);
  });

  it("returns null for non-existent post", async () => {
    const result = await markAsTraining("non-existent", tmpFile);
    expect(result).toBeNull();
  });
});
