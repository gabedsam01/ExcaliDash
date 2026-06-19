/**
 * Playwright canvas capture for the Visual Quality Pipeline (Part 6).
 *
 * Opens a drawing in the real Excalidraw canvas, waits for a STABLE-BYTES
 * settle (two consecutive identical, non-white frames — not a fixed timeout),
 * and extracts a down-sampled RGBA pixel grid via the in-page 2D context. The
 * grid is the input to the MCP `score_drawing_visual` tool (basis: "pixels").
 *
 * The e2e global-setup disables auth (`{ enableAuth: false }`), so a drawing can
 * be created and opened with no login. Browsers are preinstalled in
 * Dockerfile.playwright; locally set PW_CHROMIUM to a chromium executable if the
 * headless-shell variant is not downloaded.
 *
 * Usage (within the e2e stack):
 *   npx tsx e2e/visual-capture.ts http://localhost:6767/editor/<id> /tmp/grid.json
 * or import { captureCanvasGrid } from "./visual-capture" inside a spec.
 */
import { chromium, type Page } from "@playwright/test";
import { writeFileSync } from "fs";

const CANVAS = "canvas.excalidraw__canvas.interactive";
/** Down-sample the captured canvas to at most this many pixels per side. */
const MAX_SIDE = 256;

export interface CanvasGrid {
  width: number;
  height: number;
  data: number[]; // RGBA row-major
}

/** Read a down-sampled RGBA grid from the live Excalidraw canvas. */
const readGrid = (page: Page): Promise<CanvasGrid | null> =>
  page.evaluate(
    ({ selector, maxSide }) => {
      const canvas = document.querySelector(selector) as HTMLCanvasElement | null;
      if (!canvas) return null;
      const scale = Math.min(1, maxSide / Math.max(canvas.width, canvas.height));
      const w = Math.max(1, Math.round(canvas.width * scale));
      const h = Math.max(1, Math.round(canvas.height * scale));
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const octx = off.getContext("2d");
      if (!octx) return null;
      octx.fillStyle = "#ffffff";
      octx.fillRect(0, 0, w, h);
      octx.drawImage(canvas, 0, 0, w, h);
      const img = octx.getImageData(0, 0, w, h);
      return { width: w, height: h, data: Array.from(img.data) };
    },
    { selector: CANVAS, maxSide: MAX_SIDE },
  );

const nonWhiteFraction = (grid: CanvasGrid): number => {
  let ink = 0;
  const n = grid.width * grid.height;
  for (let i = 0; i < grid.data.length; i += 4) {
    if (grid.data[i] < 245 || grid.data[i + 1] < 245 || grid.data[i + 2] < 245) ink += 1;
  }
  return n > 0 ? ink / n : 0;
};

const fingerprint = (grid: CanvasGrid): string => {
  // cheap, order-sensitive hash of a sparse sample
  let h = 0;
  for (let i = 0; i < grid.data.length; i += 97) h = (h * 31 + grid.data[i]) >>> 0;
  return `${grid.width}x${grid.height}:${h}`;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Open a URL and return a settled, non-blank canvas grid. */
export const captureCanvasGrid = async (
  url: string,
  opts: { settleRounds?: number; maxWaitMs?: number } = {},
): Promise<CanvasGrid> => {
  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROMIUM || undefined,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector(CANVAS, { timeout: 30000 });

    const deadline = Date.now() + (opts.maxWaitMs ?? 30000);
    const needed = opts.settleRounds ?? 2;
    let prev = "";
    let stable = 0;
    let grid: CanvasGrid | null = null;
    while (Date.now() < deadline) {
      await sleep(300);
      const g = await readGrid(page);
      if (!g) continue;
      if (nonWhiteFraction(g) < 0.001) {
        stable = 0; // blank frame — keep waiting
        continue;
      }
      const fp = fingerprint(g);
      if (fp === prev) stable += 1;
      else stable = 0;
      prev = fp;
      grid = g;
      if (stable >= needed) break;
    }
    if (!grid || nonWhiteFraction(grid) < 0.001) {
      throw new Error("Canvas never produced a stable, non-blank frame.");
    }
    return grid;
  } finally {
    await browser.close();
  }
};

// ----------------------------------------------------------------- CLI entry
const isMain = (() => {
  try {
    return process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop() ?? "");
  } catch {
    return false;
  }
})();

if (isMain) {
  const [, , url, out] = process.argv;
  if (!url) {
    console.error("usage: visual-capture <editor-url> [out.json]");
    process.exit(2);
  }
  captureCanvasGrid(url)
    .then((grid) => {
      const ink = nonWhiteFraction(grid);
      if (out) writeFileSync(out, JSON.stringify(grid));
      console.log(
        JSON.stringify({
          ok: true,
          width: grid.width,
          height: grid.height,
          inkFraction: Math.round(ink * 1000) / 1000,
          out: out ?? null,
        }),
      );
    })
    .catch((err) => {
      console.error("capture failed:", (err as Error).message);
      process.exit(1);
    });
}
