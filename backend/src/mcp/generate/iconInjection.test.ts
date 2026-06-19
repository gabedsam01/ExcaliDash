import { describe, expect, it } from "vitest";
import { generateDiagramScene } from "./diagram";
import { injectConceptIcons } from "./iconInjection";
import { scoreScene } from "../quality/score";
import { isLibraryElement } from "../libraries/metadata";
import { elementBBox, overlapRatio } from "../geometry/geometry";
import type { ExcalidrawElement } from "../types";

const archScene = () =>
  generateDiagramScene({
    structure: {
      nodes: [
        { id: "web", label: "Web · Next.js :3000" },
        { id: "api", label: "API · NestJS :3001" },
        { id: "pg", label: "PostgreSQL 16 :5432" },
        { id: "redis", label: "Redis 7 :6379" },
        { id: "guest", label: "Visitante público" }, // unrecognized
      ],
      edges: [
        { from: "guest", to: "web" },
        { from: "web", to: "api" },
        { from: "api", to: "pg" },
        { from: "api", to: "redis" },
      ],
    },
    presetId: "technical-docs",
    title: "Architecture",
  });

const cardFor = (els: ExcalidrawElement[], label: string) => {
  const text = els.find((e) => e.type === "text" && e.text === label);
  const card = text ? els.find((e) => e.id === text.containerId) : undefined;
  return { text, card };
};

describe("auto icon injection", () => {
  it("injects real bundled icons for recognized nodes only", () => {
    const base = archScene();
    const { scene, injected } = injectConceptIcons(base, { minimumScore: 95 });
    expect(injected).toBe(4); // web/api/pg/redis recognized; guest is not
    const icons = scene.elements.filter(isLibraryElement);
    expect(icons.length).toBeGreaterThanOrEqual(4);
    // every injected icon carries bundled provenance
    expect(
      icons.every(
        (el) =>
          (el as { customData?: { excalidash?: { library?: string } } })
            .customData?.excalidash?.library === "bundled:excalidash-icons",
      ),
    ).toBe(true);
  });

  it("leaves unrecognized nodes as clean primitive cards (no icon)", () => {
    const { scene } = injectConceptIcons(archScene(), { minimumScore: 95 });
    const { card } = cardFor(scene.elements, "Visitante público");
    expect(card).toBeDefined();
    const box = elementBBox(card!);
    const hasIcon = scene.elements.some(
      (el) => isLibraryElement(el) && overlapRatio(box, elementBBox(el)) > 0.02,
    );
    expect(hasIcon).toBe(false);
  });

  it("groups card + label + icon under one shared groupId", () => {
    const { scene } = injectConceptIcons(archScene(), { minimumScore: 95 });
    const { text, card } = cardFor(scene.elements, "PostgreSQL 16 :5432");
    expect(card && text).toBeTruthy();
    const groupId = `${card!.id}__w`;
    expect(card!.groupIds).toContain(groupId);
    expect(text!.groupIds).toContain(groupId);
    const icon = scene.elements.find(
      (el) => isLibraryElement(el) && (el.groupIds ?? []).includes(groupId),
    );
    expect(icon).toBeDefined();
  });

  it("does not lower the score (guard) and keeps zero hard blockers", () => {
    const base = archScene();
    const before = scoreScene(base, 95);
    const { scene } = injectConceptIcons(base, { minimumScore: 95 });
    const after = scoreScene(scene, 95);
    expect(after.hardBlockers).toHaveLength(0);
    expect(after.score).toBeGreaterThanOrEqual(before.score);
  });

  it("is idempotent — a second pass injects nothing", () => {
    const { scene } = injectConceptIcons(archScene(), { minimumScore: 95 });
    const again = injectConceptIcons(scene, { minimumScore: 95 });
    expect(again.injected).toBe(0);
  });

  it("clears MISSING_ICON / NO_LIBRARY_USAGE under architecture gates after injection", () => {
    const base = archScene();
    const arch = { requireIcons: true, requireLibrary: true, libraryRequiredSeverity: "warning" as const };
    const beforeCodes = new Set(scoreScene(base, 95, arch).issues.map((i) => i.code));
    expect(beforeCodes.has("MISSING_ICON")).toBe(true);
    const { scene } = injectConceptIcons(base, { minimumScore: 95, lintOverrides: arch });
    const afterCodes = new Set(scoreScene(scene, 95, arch).issues.map((i) => i.code));
    expect(afterCodes.has("NO_LIBRARY_USAGE")).toBe(false);
  });
});
