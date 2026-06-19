import "@testing-library/jest-dom/vitest";
// Initialize app-shell i18n for every test worker so components that call
// useTranslation() resolve real strings (English defaults) even when their
// usual i18n import chain is mocked away (e.g. a mocked Sidebar).
import "../i18n";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

URL.createObjectURL = vi.fn(() => "blob:mock-url");
URL.revokeObjectURL = vi.fn();

global.fetch = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});
