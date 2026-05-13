import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { loadHoldingsCsv } from "./loadCsv";

describe("loadHoldingsCsv", () => {
  it("loads holdings rows from a CSV file", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "load-holdings-csv-"));
    const dir = join(rootDir, "data", "holdings", "2026-05-12");
    await mkdir(dir, { recursive: true });
    await writeFile(
      join(dir, "00992A.csv"),
      [
        "date,etfCode,symbol,name,shares,weight,closePrice,changePercent,shareDelta,status,sourceUrl,fetchedAt",
        "2026-05-12,00992A,2330,台積電,1761000,7.46,2255,0.8949,0,不變,https://goal-star.com/fund/00992A,2026-05-12T13:00:00.000Z",
      ].join("\n"),
      "utf8"
    );

    await expect(
      loadHoldingsCsv({
        rootDir,
        date: "2026-05-12",
        etfCode: "00992A",
      })
    ).resolves.toEqual([
      {
        date: "2026-05-12",
        etfCode: "00992A",
        symbol: "2330",
        name: "台積電",
        shares: 1761000,
        weight: 7.46,
        closePrice: 2255,
        changePercent: 0.8949,
        shareDelta: 0,
        status: "不變",
        sourceUrl: "https://goal-star.com/fund/00992A",
        fetchedAt: "2026-05-12T13:00:00.000Z",
      },
    ]);
  });

  it("returns an empty list when a dated ETF CSV is missing", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "load-holdings-csv-"));

    await expect(
      loadHoldingsCsv({
        rootDir,
        date: "2026-05-12",
        etfCode: "00992A",
      })
    ).resolves.toEqual([]);
  });
});
