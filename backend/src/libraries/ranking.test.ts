import { describe, expect, it } from "vitest";
import {
  matchesQuery,
  rankLibraries,
  scoreLibrary,
  type RankableLibrary,
} from "./ranking";

const lib = (over: Partial<RankableLibrary>): RankableLibrary => ({
  name: "Example",
  ...over,
});

describe("scoreLibrary", () => {
  it("scores exact name above alias above starts-with above contains", () => {
    const exact = scoreLibrary("aws architecture icons", lib({ name: "AWS Architecture Icons" }));
    const alias = scoreLibrary("aws", lib({ name: "AWS Architecture Icons", aliases: ["aws"] }));
    const starts = scoreLibrary("aws", lib({ name: "AWS Architecture Icons" }));
    const contains = scoreLibrary("architecture", lib({ name: "AWS Architecture Icons" }));
    expect(exact).toBeGreaterThan(alias);
    expect(alias).toBeGreaterThan(starts);
    // "aws" starts the name -> starts-with; "architecture" only contained.
    expect(starts).toBeGreaterThan(contains);
    expect(contains).toBeGreaterThan(0);
  });

  it("scores itemNames and description matches", () => {
    const item = scoreLibrary("lambda", lib({ name: "AWS Serverless", itemNames: ["Lambda"] }));
    const desc = scoreLibrary("serverless", lib({ name: "X", description: "serverless stuff" }));
    expect(item).toBeGreaterThan(0);
    expect(desc).toBeGreaterThan(0);
    expect(item).toBeGreaterThan(desc);
  });

  it("applies a curated boost only when enabled", () => {
    const withBoost = scoreLibrary("", lib({ curated: true }));
    const withoutBoost = scoreLibrary("", lib({ curated: true }), {
      applyCuratedBoost: false,
    });
    expect(withBoost).toBeGreaterThan(withoutBoost);
  });

  it("applies a category boost only for the matching category", () => {
    const matched = scoreLibrary("", lib({ category: "cloud_devops" }), {
      category: "cloud_devops",
    });
    const unmatched = scoreLibrary("", lib({ category: "security" }), {
      category: "cloud_devops",
    });
    expect(matched).toBeGreaterThan(unmatched);
  });

  it("uses version/updated only as a tie-breaker (never overturns a match)", () => {
    const matchOldLowVersion = scoreLibrary("box", lib({ name: "Box", version: 1 }));
    const noMatchNewHighVersion = scoreLibrary(
      "box",
      lib({ name: "Circle", version: 99, updatedDate: new Date() }),
    );
    expect(matchOldLowVersion).toBeGreaterThan(noMatchNewHighVersion);
  });
});

describe("rankLibraries", () => {
  it("ranks best matches first and is deterministic", () => {
    const libs = [
      lib({ name: "Cloud Design Patterns" }),
      lib({ name: "Cloud" }),
      lib({ name: "AWS Cloud Practitioner" }),
    ];
    const ranked = rankLibraries("cloud", libs);
    expect(ranked[0].name).toBe("Cloud"); // exact
    // deterministic re-run
    expect(rankLibraries("cloud", libs).map((l) => l.name)).toEqual(
      ranked.map((l) => l.name),
    );
  });

  it("orders an empty query by curated then priority then name", () => {
    const libs = [
      lib({ name: "Zeta", curated: false }),
      lib({ name: "Beta", curated: true, priority: 1 }),
      lib({ name: "Alpha", curated: true, priority: 5 }),
    ];
    const ranked = rankLibraries("", libs);
    expect(ranked.map((l) => l.name)).toEqual(["Alpha", "Beta", "Zeta"]);
  });
});

describe("matchesQuery", () => {
  it("returns true for empty query, false for irrelevant", () => {
    expect(matchesQuery("", lib({ name: "Anything" }))).toBe(true);
    expect(matchesQuery("zzz", lib({ name: "Web Kit" }))).toBe(false);
    expect(matchesQuery("kit", lib({ name: "Web Kit" }))).toBe(true);
    expect(matchesQuery("aws", lib({ name: "X", aliases: ["aws"] }))).toBe(true);
  });
});
