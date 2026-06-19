import { describe, expect, it } from "vitest";
import { blendScore, scoreVisualFromPixels, scoreVisualFromScene, type PixelGrid } from "./visualScore";
import { generateDiagramScene } from "../generate/diagram";
import { injectConceptIcons } from "../generate/iconInjection";

const grid = (width: number, height: number, paint: (x: number, y: number) => [number, number, number]): PixelGrid => {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const [r, g, b] = paint(x, y);
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  return { width, height, data };
};

describe("scoreVisualFromPixels", () => {
  it("scores a flat blank canvas far below a varied, coloured one", () => {
    const blank = grid(48, 48, () => [255, 255, 255]);
    const varied = grid(48, 48, (x, y) => {
      if (y >= 6 && y < 18 && x >= 6 && x < 42) return [59, 91, 219]; // blue band
      if (y >= 26 && y < 38 && x >= 6 && x < 42) return [47, 158, 68]; // green band
      if ((x + y) % 7 === 0) return [20, 20, 20]; // ink speckle for contrast
      return [255, 255, 255];
    });
    const flatScore = scoreVisualFromPixels(blank).score;
    const variedScore = scoreVisualFromPixels(varied).score;
    expect(variedScore).toBeGreaterThan(flatScore + 15); // clear separation
    expect(flatScore).toBeGreaterThanOrEqual(0);
    expect(variedScore).toBeLessThanOrEqual(100);
  });
});

describe("scoreVisualFromScene (proxy)", () => {
  const archScene = () =>
    generateDiagramScene({
      structure: {
        nodes: [
          { id: "web", label: "Web · Next.js" },
          { id: "api", label: "API · NestJS" },
          { id: "pg", label: "PostgreSQL" },
          { id: "redis", label: "Redis" },
        ],
        edges: [
          { from: "web", to: "api" },
          { from: "api", to: "pg" },
          { from: "api", to: "redis" },
        ],
      },
      presetId: "technical-docs",
      title: "Arch",
    });

  it("rates an icon-injected diagram above a bare one", () => {
    const bare = archScene();
    const { scene: polished } = injectConceptIcons(bare, { minimumScore: 95 });
    const bareScore = scoreVisualFromScene(bare).score;
    const polishedScore = scoreVisualFromScene(polished).score;
    expect(polishedScore).toBeGreaterThan(bareScore);
    expect(scoreVisualFromScene(polished).metrics.iconCoverage).toBeGreaterThan(0.5);
  });

  it("keeps scores within 0..100", () => {
    const s = scoreVisualFromScene(archScene()).score;
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(100);
  });
});

describe("blendScore", () => {
  it("keeps geometry dominant and is monotonic in visual", () => {
    expect(blendScore(100, 0)).toBe(70);
    expect(blendScore(100, 100)).toBe(100);
    expect(blendScore(90, 80)).toBeGreaterThan(blendScore(90, 40));
  });
});
