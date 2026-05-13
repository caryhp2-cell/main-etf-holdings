import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { getHoldingCsvResponseHeaders, resolveHoldingCsvPath } from "./readHoldingCsv";

describe("resolveHoldingCsvPath", () => {
  it("resolves manifest CSV URLs to repo data files", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "holding-csv-route-"));
    const dir = join(rootDir, "data", "holdings", "2026-05-12");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "00992A.csv"), "date,etfCode\n", "utf8");

    await expect(
      resolveHoldingCsvPath({
        rootDir,
        date: "2026-05-12",
        etfCodeParam: "00992A.csv",
      })
    ).resolves.toBe(join(dir, "00992A.csv"));
  });

  it("rejects invalid route parameters before touching the filesystem", async () => {
    await expect(
      resolveHoldingCsvPath({
        rootDir: tmpdir(),
        date: "../2026-05-12",
        etfCodeParam: "00992A.csv",
      })
    ).rejects.toThrow(/Invalid holdings date/);

    await expect(
      resolveHoldingCsvPath({
        rootDir: tmpdir(),
        date: "2026-05-12",
        etfCodeParam: "00992A.txt",
      })
    ).rejects.toThrow(/Invalid ETF CSV file/);
  });
});

describe("getHoldingCsvResponseHeaders", () => {
  it("returns CSV download headers", () => {
    expect(getHoldingCsvResponseHeaders("00992A.csv")).toEqual({
      "content-disposition": 'attachment; filename="00992A.csv"',
      "content-type": "text/csv; charset=utf-8",
    });
  });
});
