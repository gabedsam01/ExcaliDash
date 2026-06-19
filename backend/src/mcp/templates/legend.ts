/**
 * Legend generator (Part 4). Architecture/system diagrams ship a small grouped
 * legend key (solid = sync, dashed = async, plus node-type swatches) placed
 * clear of the diagram's bounding box. Elements are tagged role legend/
 * legend-item so isLegendElement() recognizes them and MISSING_LEGEND clears.
 */
import type { ExcalidrawElement, ExcalidrawScene } from "../types";
import { snapToGrid, unionBBox } from "../geometry/geometry";
import { isLegendElement } from "../libraries/metadata";
import { getPreset, type VisualPreset } from "./presets";

let seq = 1;
const eid = (p: string): string => `legend_${p}_${(seq += 1).toString(36)}`;

interface P {
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  bg?: string;
  stroke?: string;
  strokeStyle?: string;
  text?: string;
  fontSize?: number;
  fontFamily?: number;
  textAlign?: string;
  points?: Array<[number, number]>;
  role: "legend" | "legend-item";
  groupId: string;
}

const mk = (p: P): ExcalidrawElement => {
  const el: ExcalidrawElement = {
    id: eid(p.type),
    type: p.type,
    x: p.x,
    y: p.y,
    width: p.width,
    height: p.height,
    angle: 0,
    strokeColor: p.stroke ?? "#1e1e1e",
    backgroundColor: p.bg ?? "transparent",
    fillStyle: "solid",
    strokeWidth: 2,
    strokeStyle: p.strokeStyle ?? "solid",
    roughness: 0,
    opacity: 100,
    groupIds: [p.groupId],
    frameId: null,
    roundness: p.type === "rectangle" ? { type: 3 } : null,
    seed: (seq * 2654435761) % 2147483647,
    version: 1,
    versionNonce: (seq * 40503) % 2147483647,
    isDeleted: false,
    boundElements: null,
    updated: 1,
    link: null,
    locked: false,
    customData: { excalidash: { role: p.role } },
  };
  if (p.text !== undefined) {
    el.text = p.text;
    el.originalText = p.text;
    el.fontSize = p.fontSize ?? 16;
    el.fontFamily = p.fontFamily ?? 2;
    el.textAlign = p.textAlign ?? "left";
    el.verticalAlign = "middle";
    el.containerId = null;
    el.lineHeight = 1.25;
  }
  if (p.points) {
    el.points = p.points;
    el.lastCommittedPoint = null;
    el.endArrowhead = null;
  }
  return el;
};

export interface LegendRow {
  kind: "solid" | "dashed" | "swatch";
  label: string;
  color?: string;
}

const DEFAULT_ROWS: LegendRow[] = [
  { kind: "solid", label: "sync" },
  { kind: "dashed", label: "async / secondary" },
  { kind: "swatch", label: "datastore", color: "#4dabf7" },
  { kind: "swatch", label: "service / API", color: "#e8590c" },
];

/** Build a grouped legend box anchored at (x, y). */
export const renderLegend = (
  preset: VisualPreset,
  x: number,
  y: number,
  rows: LegendRow[] = DEFAULT_ROWS,
): ExcalidrawElement[] => {
  const groupId = eid("grp");
  const pad = 16;
  const rowH = 28;
  const width = 220;
  const height = pad * 2 + 28 + rows.length * rowH;
  const els: ExcalidrawElement[] = [];
  // container
  els.push(
    mk({
      type: "rectangle",
      x,
      y,
      width,
      height,
      bg: preset.cardBackground === "transparent" ? "#ffffff" : preset.cardBackground,
      stroke: preset.stroke,
      role: "legend",
      groupId,
    }),
  );
  // title
  els.push(
    mk({
      type: "text",
      x: x + pad,
      y: y + pad,
      width: width - pad * 2,
      height: 22,
      text: "Legend",
      fontSize: 18,
      fontFamily: preset.fontFamily,
      stroke: preset.textColor,
      role: "legend-item",
      groupId,
    }),
  );
  let ry = y + pad + 34;
  for (const row of rows) {
    const sampleX = x + pad;
    const sampleW = 36;
    if (row.kind === "swatch") {
      els.push(
        mk({
          type: "rectangle",
          x: sampleX,
          y: ry,
          width: 22,
          height: 16,
          bg: row.color ?? preset.accent,
          stroke: preset.stroke,
          role: "legend-item",
          groupId,
        }),
      );
    } else {
      els.push(
        mk({
          type: "line",
          x: sampleX,
          y: ry + 8,
          width: sampleW,
          height: 0,
          stroke: preset.stroke,
          strokeStyle: row.kind === "dashed" ? "dashed" : "solid",
          points: [
            [0, 0],
            [sampleW, 0],
          ],
          role: "legend-item",
          groupId,
        }),
      );
    }
    els.push(
      mk({
        type: "text",
        x: sampleX + sampleW + 10,
        y: ry - 2,
        width: width - (pad + sampleW + 10) - pad,
        height: 20,
        text: row.label,
        fontSize: 16,
        fontFamily: preset.fontFamily,
        stroke: preset.textColor,
        role: "legend-item",
        groupId,
      }),
    );
    ry += rowH;
  }
  return els;
};

/** Append a legend to the scene if it has none. Returns a new scene + flag. */
export const ensureLegend = (
  scene: ExcalidrawScene,
  presetId?: string | null,
): { scene: ExcalidrawScene; added: boolean } => {
  if (scene.elements.some(isLegendElement)) return { scene, added: false };
  const preset = getPreset(presetId);
  const box = unionBBox(scene.elements);
  const grid = preset.grid;
  const x = box ? snapToGrid(box.maxX + 64, grid) : 0;
  const y = box ? snapToGrid(box.minY, grid) : 0;
  const legend = renderLegend(preset, x, y);
  return {
    scene: { ...scene, elements: [...scene.elements, ...legend] },
    added: true,
  };
};
