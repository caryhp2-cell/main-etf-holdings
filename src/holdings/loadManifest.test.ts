import { describe, expect, it } from "vitest";

import { loadManifest } from "./loadManifest";

describe("loadManifest", () => {
  it("returns the generated holdings manifest for UI code", () => {
    const manifest = loadManifest();

    expect(manifest).toHaveProperty("generatedAt");
    expect(manifest.etfs).toEqual(["00981A", "00992A", "00991A"]);
    expect(manifest.dates).toEqual([...manifest.dates].sort());
    expect(manifest.files.every((file) => file.path.startsWith("/data/holdings/"))).toBe(
      true
    );
  });
});
