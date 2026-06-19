/**
 * Extract a logical node/edge graph from an Excalidraw scene: shapes with a
 * label become nodes; bound arrows become directed edges. Used by
 * validate_architecture and convert_diagram_type.
 */
import type { ExcalidrawElement, ExcalidrawScene } from "../types";
import type { GraphEdge, GraphNode } from "../layout/graphLayout";
import { bboxCenter, elementBBox, isShape, liveElements } from "../geometry/geometry";

export interface ExtractedGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export const extractGraph = (scene: ExcalidrawScene): ExtractedGraph => {
  const elements = liveElements(scene.elements);
  const byId = new Map(elements.map((el) => [el.id, el]));

  // Label per shape: prefer bound text, else nearest free text by center.
  const labelFor = (shape: ExcalidrawElement): string => {
    const bound = elements.find(
      (el) => el.type === "text" && el.containerId === shape.id,
    );
    if (bound?.text) return String(bound.text);
    const center = bboxCenter(elementBBox(shape));
    let best: { text: string; dist: number } | null = null;
    for (const el of elements) {
      if (el.type !== "text" || el.containerId) continue;
      const [tx, ty] = bboxCenter(elementBBox(el));
      const dist = Math.hypot(tx - center[0], ty - center[1]);
      if (dist < 60 && (!best || dist < best.dist)) {
        best = { text: String(el.text ?? ""), dist };
      }
    }
    return best?.text ?? "";
  };

  const nodes: GraphNode[] = [];
  for (const el of elements) {
    if (!isShape(el) && el.type !== "frame") continue;
    if (el.type === "frame") continue;
    nodes.push({ id: el.id, label: labelFor(el) || "Node" });
  }

  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges: GraphEdge[] = [];
  for (const el of elements) {
    if (el.type !== "arrow") continue;
    const from = el.startBinding?.elementId;
    const to = el.endBinding?.elementId;
    if (from && to && nodeIds.has(from) && nodeIds.has(to)) {
      edges.push({ from, to });
    }
  }

  return { nodes, edges };
};
