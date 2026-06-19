import { describe, it, expect } from "vitest";
import {
  getAutosaveDebounceMs,
  getAutosaveMaxWaitMs,
  saveStatusLabel,
  AUTOSAVE_DEFAULT_DEBOUNCE_MS,
  AUTOSAVE_DEFAULT_MAX_WAIT_MS,
} from "./autosaveConfig";

describe("getAutosaveDebounceMs", () => {
  it("uses the default when unset", () => {
    expect(getAutosaveDebounceMs({})).toBe(AUTOSAVE_DEFAULT_DEBOUNCE_MS);
  });

  it("reads a valid override", () => {
    expect(getAutosaveDebounceMs({ VITE_AUTOSAVE_DEBOUNCE_MS: "2500" })).toBe(2500);
    expect(getAutosaveDebounceMs({ VITE_AUTOSAVE_DEBOUNCE_MS: 800 })).toBe(800);
  });

  it("clamps out-of-range and ignores junk", () => {
    expect(getAutosaveDebounceMs({ VITE_AUTOSAVE_DEBOUNCE_MS: "10" })).toBe(200); // min
    expect(getAutosaveDebounceMs({ VITE_AUTOSAVE_DEBOUNCE_MS: "999999" })).toBe(60_000); // max
    expect(getAutosaveDebounceMs({ VITE_AUTOSAVE_DEBOUNCE_MS: "abc" })).toBe(
      AUTOSAVE_DEFAULT_DEBOUNCE_MS,
    );
  });
});

describe("getAutosaveMaxWaitMs", () => {
  it("uses the default when unset", () => {
    expect(getAutosaveMaxWaitMs({})).toBe(AUTOSAVE_DEFAULT_MAX_WAIT_MS);
  });

  it("is never less than the debounce window", () => {
    const env = { VITE_AUTOSAVE_DEBOUNCE_MS: "5000", VITE_AUTOSAVE_MAX_WAIT_MS: "1000" };
    expect(getAutosaveMaxWaitMs(env)).toBe(5000);
  });

  it("reads a valid override", () => {
    expect(getAutosaveMaxWaitMs({ VITE_AUTOSAVE_MAX_WAIT_MS: "20000" })).toBe(20000);
  });
});

describe("saveStatusLabel", () => {
  it("maps statuses to labels", () => {
    expect(saveStatusLabel("saving")).toBe("Saving…");
    expect(saveStatusLabel("saved")).toBe("Saved");
    expect(saveStatusLabel("error")).toBe("Save failed");
    expect(saveStatusLabel("retrying")).toBe("Retrying…");
    expect(saveStatusLabel("idle")).toBe("");
  });
});
