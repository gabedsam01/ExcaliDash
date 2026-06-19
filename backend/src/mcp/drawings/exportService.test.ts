import { describe, expect, it } from "vitest";
import { exportScene, sceneToSvg } from "./exportService";
import type { ExcalidrawScene } from "../types";

const scene = (elements: unknown[]): ExcalidrawScene =>
  ({
    type: "excalidraw",
    version: 2,
    source: "test",
    elements: elements as never,
    appState: { viewBackgroundColor: "#ffffff" },
    files: {},
  }) as ExcalidrawScene;

describe("exportService", () => {
  it("exports .excalidraw JSON", () => {
    const res = exportScene(
      scene([{ id: "a", type: "rectangle", x: 0, y: 0, width: 100, height: 60 }]),
      "excalidraw",
      100 * 1024 * 1024,
    );
    expect(res.mimeType).toBe("application/json");
    expect(JSON.parse(res.content!).type).toBe("excalidraw");
  });

  it("renders SVG", () => {
    const res = exportScene(
      scene([{ id: "a", type: "rectangle", x: 0, y: 0, width: 100, height: 60, backgroundColor: "#a5d8ff" }]),
      "svg",
      100 * 1024 * 1024,
    );
    expect(res.content).toContain("<svg");
    expect(res.content).toContain('fill="#a5d8ff"');
  });

  it("does NOT inject markup via malicious colors (attribute escaping/allowlist)", () => {
    const svg = sceneToSvg(
      scene([
        {
          id: "evil",
          type: "rectangle",
          x: 0,
          y: 0,
          width: 100,
          height: 60,
          strokeColor: '#fff"/><script>alert(1)</script><rect stroke="#000',
          backgroundColor: 'red" onload="evil()',
        },
      ]),
    );
    expect(svg).not.toContain("<script");
    expect(svg).not.toContain("onload=");
    // The unsafe colors fall back rather than break out of the attribute.
    expect(svg).toContain('stroke="#1e1e1e"');
    expect(svg).toContain('fill="none"');
  });

  it("escapes text content and coerces non-numeric coordinates", () => {
    const svg = sceneToSvg(
      scene([
        {
          id: "t",
          type: "text",
          x: "10\" onmouseover=\"x" as unknown as number,
          y: 0,
          width: 100,
          height: 20,
          text: "<b>hi & bye</b>",
          fontSize: 20,
        },
      ]),
    );
    expect(svg).not.toContain("onmouseover");
    expect(svg).not.toContain("NaN");
    expect(svg).toContain("&lt;b&gt;hi &amp; bye&lt;/b&gt;");
  });

  it("returns a structured PNG fallback (never throws)", () => {
    const res = exportScene(scene([]), "png", 100 * 1024 * 1024);
    expect(res.unsupported).toBe(true);
    expect(res.fallback?.alternatives).toContain("svg");
  });
});
