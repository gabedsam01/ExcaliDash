import { describe, expect, it } from "vitest";
import { buildToolRegistry } from "./toolRegistry";

const EXPECTED_TOOLS = [
  // Core (9)
  "read_mcp_guide",
  "create_drawing",
  "create_diagram_from_prompt",
  "update_drawing",
  "get_drawing",
  "save_drawing",
  "save_version",
  "get_drawing_url",
  "export_drawing",
  // Libraries (5)
  "search_libraries",
  "inspect_library",
  "cache_library",
  "add_library_items",
  "add_library_items_normalized",
  // Quality / geometry (4)
  "lint_drawing",
  "score_drawing",
  "repair_drawing",
  "auto_polish_drawing",
  // Architecture / code (4)
  "create_from_repo_analysis",
  "apply_architecture_skill",
  "validate_architecture",
  "suggest_architecture_improvements",
  // Templates / transformation (3)
  "list_templates",
  "create_from_template",
  "convert_diagram_type",
];

describe("MCP tool registry", () => {
  const tools = buildToolRegistry();

  it("exposes exactly 25 public tools", () => {
    expect(tools).toHaveLength(25);
    expect(EXPECTED_TOOLS).toHaveLength(25);
  });

  it("matches the required tool names exactly (no extras, no missing)", () => {
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual([...EXPECTED_TOOLS].sort());
  });

  it("has unique names", () => {
    const names = tools.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("every tool has a description and a valid object JSON Schema", () => {
    for (const tool of tools) {
      expect(tool.description.length).toBeGreaterThan(10);
      expect(tool.jsonSchema).toBeTruthy();
      expect((tool.jsonSchema as { type?: string }).type).toBe("object");
      expect(tool.inputSchema).toBeTruthy();
    }
  });
});
