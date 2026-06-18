/**
 * Diagram generation from a prompt or structured input. No LLM here — this is
 * a deterministic parser + layout. Structured input (nodes/edges) is preferred;
 * free text is parsed for "A -> B" edges or treated as a sequential flow.
 */
import type { ExcalidrawScene } from "../types";
import {
  layoutGraph,
  type GraphEdge,
  type GraphNode,
} from "../layout/graphLayout";
import { getPreset } from "../templates/presets";

export interface DiagramRequest {
  prompt?: string;
  diagramType?: string;
  structure?: { nodes: GraphNode[]; edges?: GraphEdge[] };
  presetId?: string;
  title?: string;
  direction?: "TB" | "LR";
}

const slug = (label: string): string =>
  label
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "node";

const ARROW = /\s*(?:-->|->|→|=>)\s*/;

/** Parse free text into a node/edge graph. */
export const parsePromptToGraph = (
  prompt: string,
  diagramType?: string,
): { nodes: GraphNode[]; edges: GraphEdge[] } => {
  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  const ensure = (label: string): string => {
    const clean = label.replace(/\s*#.*$/, "").trim();
    const id = slug(clean);
    if (!nodes.has(id)) nodes.set(id, { id, label: clean || id });
    return id;
  };

  const lines = String(prompt ?? "")
    .split(/[\n;]+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const flowChain: string[] = [];
  for (const line of lines) {
    if (ARROW.test(line)) {
      const parts = line.split(ARROW).map((p) => p.trim()).filter(Boolean);
      for (let i = 0; i < parts.length - 1; i += 1) {
        const labelMatch = /#\s*(.+)$/.exec(parts[i + 1]);
        const from = ensure(parts[i]);
        const to = ensure(parts[i + 1]);
        edges.push({
          from,
          to,
          label: labelMatch ? labelMatch[1].trim() : undefined,
        });
      }
    } else {
      // Comma/arrow-free line -> nodes forming a sequential flow.
      const tokens = line
        .split(/[,]/)
        .map((t) => t.trim())
        .filter(Boolean);
      for (const token of tokens) flowChain.push(ensure(token));
    }
  }

  // If no explicit edges and we have a flow chain, connect it sequentially.
  const sequential =
    !diagramType ||
    /flow|workflow|sequence|process|pipeline|step/i.test(diagramType);
  if (edges.length === 0 && sequential && flowChain.length > 1) {
    for (let i = 0; i < flowChain.length - 1; i += 1) {
      edges.push({ from: flowChain[i], to: flowChain[i + 1] });
    }
  }

  return { nodes: Array.from(nodes.values()), edges };
};

export const buildGraphFromRequest = (
  request: DiagramRequest,
): { nodes: GraphNode[]; edges: GraphEdge[]; title?: string; direction: "TB" | "LR" } => {
  let nodes: GraphNode[];
  let edges: GraphEdge[];
  if (request.structure && Array.isArray(request.structure.nodes)) {
    nodes = request.structure.nodes;
    edges = request.structure.edges ?? [];
  } else {
    const parsed = parsePromptToGraph(request.prompt ?? "", request.diagramType);
    nodes = parsed.nodes;
    edges = parsed.edges;
  }

  const direction =
    request.direction ??
    (/sequence|swimlane|timeline/i.test(request.diagramType ?? "") ? "LR" : "TB");

  const title =
    request.title ??
    (request.diagramType ? humanize(request.diagramType) : undefined);

  return { nodes, edges, title, direction };
};

const humanize = (value: string): string =>
  value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

/** End-to-end: request -> laid-out Excalidraw scene. */
export const generateDiagramScene = (request: DiagramRequest): ExcalidrawScene => {
  const preset = getPreset(request.presetId);
  const { nodes, edges, title, direction } = buildGraphFromRequest(request);
  if (nodes.length === 0) {
    nodes.push({ id: "empty", label: request.title ?? "Diagram" });
  }
  return layoutGraph(nodes, edges, { preset, title, direction });
};
