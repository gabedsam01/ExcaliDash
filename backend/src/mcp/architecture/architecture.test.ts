import { describe, expect, it } from "vitest";
import { validateArchitecture } from "./validator";
import { suggestImprovements } from "./patterns";
import type { GraphEdge, GraphNode } from "../layout/graphLayout";

const node = (id: string, label: string): GraphNode => ({ id, label });
const edge = (from: string, to: string): GraphEdge => ({ from, to });

describe("validate_architecture", () => {
  it("passes a clean inward-dependency architecture", () => {
    const nodes = [
      node("web", "Web App"),
      node("ctrl", "Controller"),
      node("uc", "Use Case"),
      node("dom", "Domain Entity"),
    ];
    const edges = [edge("web", "ctrl"), edge("ctrl", "uc"), edge("uc", "dom")];
    const result = validateArchitecture(nodes, edges);
    expect(result.valid).toBe(true);
    expect(result.issues.filter((i) => i.severity === "error")).toHaveLength(0);
  });

  it("flags a frontend talking directly to the database", () => {
    const nodes = [node("web", "Web App"), node("db", "PostgreSQL Database")];
    const result = validateArchitecture(nodes, [edge("web", "db")]);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.code === "FRONTEND_TO_DB")).toBe(true);
  });

  it("flags infrastructure reaching into the domain", () => {
    const nodes = [node("db", "PostgreSQL Database"), node("dom", "Domain Entity")];
    const result = validateArchitecture(nodes, [edge("db", "dom")]);
    expect(result.issues.some((i) => i.code === "INFRA_INTO_DOMAIN")).toBe(true);
    expect(result.valid).toBe(false);
  });

  it("warns when there is no trust boundary around data", () => {
    const nodes = [
      node("web", "Web App"),
      node("api", "API Service"),
      node("db", "PostgreSQL Database"),
    ];
    const edges = [edge("web", "api"), edge("api", "db")];
    const result = validateArchitecture(nodes, edges);
    expect(result.issues.some((i) => i.code === "AUTH_NO_BOUNDARY")).toBe(true);
  });

  it("warns when MCP architecture lacks transport/auth/storage separation", () => {
    const nodes = [node("mcp", "MCP Server"), node("svc", "Some Service")];
    const result = validateArchitecture(nodes, [edge("mcp", "svc")]);
    expect(result.issues.some((i) => i.code === "MCP_NO_SEPARATION")).toBe(true);
  });
});

describe("suggest_architecture_improvements", () => {
  it("recommends a trust boundary and sorts by impact", () => {
    const nodes = [
      node("web", "Web App"),
      node("api", "API Service"),
      node("db", "PostgreSQL Database"),
    ];
    const { suggestions } = suggestImprovements(nodes, [
      edge("web", "api"),
      edge("api", "db"),
    ]);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some((s) => /trust boundary/i.test(s.title))).toBe(true);
    // Highest-impact suggestion comes first.
    expect(suggestions[0].impact).toBe("high");
  });
});
