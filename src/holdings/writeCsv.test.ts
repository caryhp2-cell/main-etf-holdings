import { mkdtemp, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { describe, expect, it } from "vitest";

import type { HoldingRow } from "./types";
import { writeHoldingsCsv } from "./writeCsv";

describe("writeHoldingsCsv", () => {
  it("serializes holdings rows with the exact header order", async () => {
    const dir = await mkdtemp(join(tmpdir(), "holdings-csv-"));
    const filePath = join(dir, "nested", "00992A.csv");
    const rows: HoldingRow[] = [
      {
        date: "2026-05-12",
        etfCode: "00992A",
        symbol: "2330",
        name: "TSMC, Inc.",
        shares: 1234000,
        weight: 15.67,
        closePrice: 789.5,
        changePercent: 1.23,
        shareDelta: -12000,
        status: "æ¸›ç¢¼",
        sourceUrl: "https://goal-star.com/fund/00992A",
        fetchedAt: "2026-05-12T13:00:00.000Z",
      },
    ];

    await writeHoldingsCsv(filePath, rows);

    await expect(readFile(filePath, "utf8")).resolves.toBe(
      [
        "date,etfCode,symbol,name,shares,weight,closePrice,changePercent,shareDelta,status,sourceUrl,fetchedAt",
        '2026-05-12,00992A,2330,"TSMC, Inc.",1234000,15.67,789.5,1.23,-12000,æ¸›ç¢¼,https://goal-star.com/fund/00992A,2026-05-12T13:00:00.000Z',
        "",
      ].join("\n")
    );
  });
});
