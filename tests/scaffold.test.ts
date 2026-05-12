import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("Task 1 scaffold", () => {
  it("keeps required automation scripts wired to placeholder entrypoints", () => {
    const packageJson = JSON.parse(
      readFileSync(join(root, "package.json"), "utf8")
    ) as { scripts: Record<string, string> };

    expect(packageJson.scripts["scrape:today"]).toBe(
      "tsx scripts/scrape-goalstar.ts --today"
    );
    expect(packageJson.scripts["scrape:range"]).toBe(
      "tsx scripts/scrape-goalstar.ts"
    );
    expect(packageJson.scripts.manifest).toBe(
      "tsx scripts/build-manifest.ts"
    );
    expect(existsSync(join(root, "scripts", "scrape-goalstar.ts"))).toBe(true);
    expect(existsSync(join(root, "scripts", "build-manifest.ts"))).toBe(true);
  });
});
