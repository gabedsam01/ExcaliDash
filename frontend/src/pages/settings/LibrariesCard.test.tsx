import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  getLibraryStatus: vi.fn(),
  getLibraryPacks: vi.fn(),
  searchLibraries: vi.fn(),
  refreshLibraries: vi.fn(),
  cacheLibrary: vi.fn(),
  isAxiosError: vi.fn(() => false),
}));

vi.mock("../../api", () => apiMocks);

import { LibrariesCard } from "./LibrariesCard";

const status = {
  catalogCount: 229,
  curatedCount: 60,
  lastRefreshedAt: "2026-06-18T10:00:00.000Z",
  cacheDir: "/app/data/libraries",
  publicSearchEnabled: true,
  refreshIntervalHours: 24,
  autoRefreshOnStart: true,
};

const packs = {
  core: {
    slug: "core_pack",
    name: "Core Pack",
    description: null,
    enabled: true,
    priority: 100,
    itemCount: 27,
  },
  specialized: {
    slug: "specialized_pack",
    name: "Specialized Pack",
    description: null,
    enabled: true,
    priority: 50,
    itemCount: 80,
    categoryCount: 1,
    categories: [
      {
        slug: "cloud_devops",
        name: "Cloud & DevOps",
        category: "cloud_devops",
        description: null,
        enabled: true,
        priority: 50,
        itemCount: 13,
      },
    ],
  },
};

describe("LibrariesCard", () => {
  beforeEach(() => {
    apiMocks.getLibraryStatus.mockReset();
    apiMocks.getLibraryPacks.mockReset();
    apiMocks.searchLibraries.mockReset();
    apiMocks.refreshLibraries.mockReset();
    apiMocks.cacheLibrary.mockReset();
    apiMocks.isAxiosError.mockReturnValue(false);
    apiMocks.getLibraryStatus.mockResolvedValue(status);
    apiMocks.getLibraryPacks.mockResolvedValue(packs);
    apiMocks.searchLibraries.mockResolvedValue({
      mode: "all",
      query: "",
      category: null,
      publicSearchEnabled: true,
      count: 0,
      results: [],
    });
  });

  it("displays catalog status, core pack count, and categories", async () => {
    render(<LibrariesCard />);
    expect(await screen.findByText("229")).toBeInTheDocument();
    expect(screen.getByText("60")).toBeInTheDocument();
    expect(screen.getByText("27")).toBeInTheDocument();
    expect(screen.getByText("Enabled")).toBeInTheDocument();
    // "Cloud & DevOps" appears both as a category chip and a <select> option.
    expect(screen.getAllByText(/Cloud & DevOps/).length).toBeGreaterThan(0);
  });

  it("searches by the selected mode", async () => {
    render(<LibrariesCard />);
    await screen.findByText("229");

    fireEvent.change(screen.getByLabelText("Search mode"), {
      target: { value: "core" },
    });
    fireEvent.change(screen.getByLabelText("Search libraries"), {
      target: { value: "aws" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() =>
      expect(apiMocks.searchLibraries).toHaveBeenCalledWith({
        q: "aws",
        mode: "core",
        category: undefined,
        limit: 25,
      }),
    );
  });

  it("disables public search when the backend reports it disabled", async () => {
    apiMocks.getLibraryStatus.mockResolvedValue({
      ...status,
      publicSearchEnabled: false,
    });
    render(<LibrariesCard />);
    await screen.findByText("Disabled");
    const publicOption = screen.getByRole("option", { name: /public/i });
    expect(publicOption).toBeDisabled();
  });

  it("caches a library and renders the inspection result", async () => {
    apiMocks.searchLibraries.mockResolvedValue({
      mode: "all",
      query: "aws",
      category: null,
      publicSearchEnabled: true,
      count: 1,
      results: [
        {
          id: "lib1",
          name: "AWS Architecture Icons",
          slug: "childishgirl-aws-architecture-icons",
          description: "AWS icons",
          sourceMode: "core",
          curated: true,
          source: "childishgirl/aws-architecture-icons.excalidrawlib",
          cached: false,
        },
      ],
    });
    apiMocks.cacheLibrary.mockResolvedValue({
      id: "lib1",
      source: "childishgirl/aws-architecture-icons.excalidrawlib",
      itemCount: 42,
      sha256: "a".repeat(64),
      sizeBytes: 2048,
      cachedAt: "2026-06-18T10:05:00.000Z",
      itemNames: ["EC2", "S3"],
    });

    render(<LibrariesCard />);
    await screen.findByText("229");
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    const cacheButton = await screen.findByRole("button", {
      name: /Cache or inspect AWS Architecture Icons/i,
    });
    fireEvent.click(cacheButton);

    expect(await screen.findByText(/42 items/)).toBeInTheDocument();
    expect(apiMocks.cacheLibrary).toHaveBeenCalledWith("lib1");
  });
});
