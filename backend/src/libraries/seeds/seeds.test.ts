import { describe, expect, it } from "vitest";
import { CORE_PACK } from "./corePack";
import {
  SPECIALIZED_CATEGORIES,
  SPECIALIZED_CATEGORY_SLUGS,
  SPECIALIZED_PACK,
} from "./specializedPack";
import { CATEGORY_ALIASES, resolveCategorySlug } from "./aliases";

describe("core pack seed", () => {
  it("defines the curated core libraries", () => {
    expect(CORE_PACK.slug).toBe("core_pack");
    expect(CORE_PACK.kind).toBe("CORE");
    expect(CORE_PACK.libraries.length).toBe(27);
    // Google Architecture Icons carries alias fallbacks (no exact catalog entry).
    const google = CORE_PACK.libraries.find(
      (l) => l.name === "Google Architecture Icons",
    );
    expect(google?.aliases).toContain("GCP Icons");
  });
});

describe("specialized pack seed", () => {
  it("defines a root plus nine categories", () => {
    expect(SPECIALIZED_PACK.slug).toBe("specialized_pack");
    expect(SPECIALIZED_CATEGORIES).toHaveLength(9);
    expect(SPECIALIZED_CATEGORY_SLUGS).toEqual([
      "architecture_advanced",
      "cloud_devops",
      "data_observability",
      "logos_tech",
      "people_storytelling",
      "ui_wireframe",
      "security",
      "ai_mcp",
      "business_product",
    ]);
  });

  it("links every category to the specialized root", () => {
    for (const category of SPECIALIZED_CATEGORIES) {
      expect(category.kind).toBe("SPECIALIZED");
      expect(category.parentSlug).toBe("specialized_pack");
      expect(category.category).toBe(category.slug);
      expect(category.libraries.length).toBeGreaterThan(0);
    }
  });
});

describe("category aliases", () => {
  it("resolves slugs, aliases, and tokens", () => {
    expect(resolveCategorySlug("cloud_devops")).toBe("cloud_devops");
    expect(resolveCategorySlug("cloud")).toBe("cloud_devops");
    expect(resolveCategorySlug("devops")).toBe("cloud_devops");
    expect(resolveCategorySlug("aws")).toBe("cloud_devops");
    expect(resolveCategorySlug("gcp")).toBe("cloud_devops");
    expect(resolveCategorySlug("azure")).toBe("cloud_devops");
    expect(resolveCategorySlug("k8s")).toBe("cloud_devops");
    expect(resolveCategorySlug("security")).toBe("security");
    expect(resolveCategorySlug("ui")).toBe("ui_wireframe");
    expect(resolveCategorySlug("mcp")).toBe("ai_mcp");
  });

  it("returns null for unknown tokens", () => {
    expect(resolveCategorySlug("definitely-not-a-category")).toBeNull();
    expect(resolveCategorySlug("")).toBeNull();
    expect(resolveCategorySlug(undefined)).toBeNull();
  });

  it("only maps to real category slugs", () => {
    for (const slug of Object.values(CATEGORY_ALIASES)) {
      expect(SPECIALIZED_CATEGORY_SLUGS).toContain(slug);
    }
  });
});
