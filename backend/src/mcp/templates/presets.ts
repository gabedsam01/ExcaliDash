/**
 * Visual presets applied to generated diagrams. Each preset defines the full
 * visual language: colors, roughness, fonts, spacing, grid, card/arrow style,
 * density threshold and export preference.
 */
export interface VisualPreset {
  id: string;
  name: string;
  background: string;
  stroke: string;
  cardBackground: string;
  accent: string;
  textColor: string;
  roughness: number;
  fontFamily: number; // 1 hand-drawn, 2 normal, 3 code
  minFontSize: number;
  titleFontSize: number;
  labelFontSize: number;
  spacingX: number;
  spacingY: number;
  grid: number;
  rounded: boolean;
  strokeWidth: number;
  arrowStyle: "solid" | "dashed";
  densityThreshold: number;
  exportPreference: "svg" | "png" | "excalidraw";
  palette: string[];
}

export const PRESETS: Record<string, VisualPreset> = {
  "handdrawn-clean": {
    id: "handdrawn-clean",
    name: "Hand-drawn Clean",
    background: "#ffffff",
    stroke: "#1e1e1e",
    cardBackground: "#ffffff",
    accent: "#4263eb",
    textColor: "#1e1e1e",
    roughness: 1,
    fontFamily: 1,
    minFontSize: 16,
    titleFontSize: 28,
    labelFontSize: 16,
    spacingX: 80,
    spacingY: 100,
    grid: 20,
    rounded: true,
    strokeWidth: 2,
    arrowStyle: "solid",
    densityThreshold: 10,
    exportPreference: "svg",
    palette: ["#a5d8ff", "#b2f2bb", "#ffec99", "#ffc9c9", "#d0bfff", "#ffd8a8"],
  },
  "technical-docs": {
    id: "technical-docs",
    name: "Technical Docs",
    background: "#ffffff",
    stroke: "#343a40",
    cardBackground: "#f8f9fa",
    accent: "#1971c2",
    textColor: "#212529",
    roughness: 0,
    fontFamily: 2,
    minFontSize: 16,
    titleFontSize: 26,
    labelFontSize: 16,
    spacingX: 90,
    spacingY: 110,
    grid: 20,
    rounded: true,
    strokeWidth: 2,
    arrowStyle: "solid",
    densityThreshold: 12,
    exportPreference: "svg",
    palette: ["#e7f5ff", "#ebfbee", "#fff9db", "#fff0f6", "#f3f0ff", "#fff4e6"],
  },
  "startup-deck": {
    id: "startup-deck",
    name: "Startup Deck",
    background: "#ffffff",
    stroke: "#212529",
    cardBackground: "#f1f3f5",
    accent: "#7048e8",
    textColor: "#212529",
    roughness: 0,
    fontFamily: 2,
    minFontSize: 18,
    titleFontSize: 34,
    labelFontSize: 18,
    spacingX: 110,
    spacingY: 130,
    grid: 20,
    rounded: true,
    strokeWidth: 3,
    arrowStyle: "solid",
    densityThreshold: 8,
    exportPreference: "png",
    palette: ["#d0bfff", "#a5d8ff", "#b2f2bb", "#ffec99", "#ffc9c9", "#eebefa"],
  },
  "dark-architecture": {
    id: "dark-architecture",
    name: "Dark Architecture",
    background: "#1a1b1e",
    stroke: "#c1c2c5",
    cardBackground: "#25262b",
    accent: "#4dabf7",
    textColor: "#e9ecef",
    roughness: 0,
    fontFamily: 3,
    minFontSize: 16,
    titleFontSize: 28,
    labelFontSize: 16,
    spacingX: 100,
    spacingY: 120,
    grid: 20,
    rounded: true,
    strokeWidth: 2,
    arrowStyle: "solid",
    densityThreshold: 12,
    exportPreference: "svg",
    palette: ["#1971c2", "#2f9e44", "#e8590c", "#9c36b5", "#0c8599", "#c2255c"],
  },
  "minimal-whiteboard": {
    id: "minimal-whiteboard",
    name: "Minimal Whiteboard",
    background: "#ffffff",
    stroke: "#1e1e1e",
    cardBackground: "transparent",
    accent: "#1e1e1e",
    textColor: "#1e1e1e",
    roughness: 1,
    fontFamily: 1,
    minFontSize: 16,
    titleFontSize: 24,
    labelFontSize: 16,
    spacingX: 70,
    spacingY: 90,
    grid: 20,
    rounded: false,
    strokeWidth: 1,
    arrowStyle: "solid",
    densityThreshold: 10,
    exportPreference: "svg",
    palette: ["transparent"],
  },
  "portfolio-polished": {
    id: "portfolio-polished",
    name: "Portfolio Polished",
    background: "#ffffff",
    stroke: "#0b1021",
    cardBackground: "#f8f9fb",
    accent: "#e8590c",
    textColor: "#0b1021",
    roughness: 0,
    fontFamily: 2,
    minFontSize: 18,
    titleFontSize: 36,
    labelFontSize: 18,
    spacingX: 120,
    spacingY: 140,
    grid: 20,
    rounded: true,
    strokeWidth: 2,
    arrowStyle: "solid",
    densityThreshold: 8,
    exportPreference: "png",
    palette: ["#ffe3e3", "#d3f9d8", "#e5dbff", "#fff3bf", "#d0ebff", "#ffe8cc"],
  },
};

export const DEFAULT_PRESET_ID = "handdrawn-clean";

export const getPreset = (id?: string | null): VisualPreset =>
  (id && PRESETS[id]) || PRESETS[DEFAULT_PRESET_ID];

export const listPresets = (): Array<{ id: string; name: string }> =>
  Object.values(PRESETS).map((p) => ({ id: p.id, name: p.name }));
