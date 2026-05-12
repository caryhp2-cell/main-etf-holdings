import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { describe, expect, it } from "vitest";

import { buildHoldingsManifest, writeHoldingsManifest } from "./build-manifest";

describe("buildHoldingsManifest", () => {
  it("counts CSV data rows and sorts files by date then ETF order", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "holdings-manifest-"));

    await writeCsv(rootDir, "2026-05-12", "00981A", ["a", "b", "c"]);
    await writeCsv(rootDir, "2026-05-10", "00992A", ["a"]);
    await writeCsv(rootDir, "2026-05-12", "00992A", ["a", "b"]);
    await writeCsv(rootDir, "2026-05-10", "00985A", []);

    const manifest = await buildHoldingsManifest({
      rootDir,
      generatedAt: new Date("2026-05-12T14:30:00.000Z"),
    });

    expect(manifest).toEqual({
      generatedAt: "2026-05-12T14:30:00.000Z",
      etfs: ["00992A", "00991A", "00985A", "00981A"],
      dates: ["2026-05-10", "2026-05-12"],
      files: [
        {
          date: "2026-05-10",
          etfCode: "00992A",
          path: "/data/holdings/2026-05-10/00992A.csv",
          rowCount: 1,
        },
        {
          date: "2026-05-10",
          etfCode: "00985A",
          path: "/data/holdings/2026-05-10/00985A.csv",
          rowCount: 0,
        },
        {
          date: "2026-05-12",
          etfCode: "00992A",
          path: "/data/holdings/2026-05-12/00992A.csv",
          rowCount: 2,
        },
        {
          date: "2026-05-12",
          etfCode: "00981A",
          path: "/data/holdings/2026-05-12/00981A.csv",
          rowCount: 3,
        },
      ],
    });
  });
});

describe("writeHoldingsManifest", () => {
  it("writes pretty JSON to data/manifest.json", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "holdings-manifest-"));

    await writeCsv(rootDir, "2026-05-12", "00992A", ["a"]);

    const outputPath = await writeHoldingsManifest({
      rootDir,
      generatedAt: new Date("2026-05-12T14:30:00.000Z"),
    });

    await expect(readFile(outputPath, "utf8")).resolves.toBe(
      `${JSON.stringify(
        {
          generatedAt: "2026-05-12T14:30:00.000Z",
          etfs: ["00992A", "00991A", "00985A", "00981A"],
          dates: ["2026-05-12"],
          files: [
            {
              date: "2026-05-12",
              etfCode: "00992A",
              path: "/data/holdings/2026-05-12/00992A.csv",
              rowCount: 1,
            },
          ],
        },
        null,
        2
      )}\n`
    );
  });
});

async function writeCsv(
  rootDir: string,
  date: string,
  etfCode: string,
  rows: string[]
): Promise<void> {
  const csv = ["date,etfCode,symbol", ...rows.map((symbol) => `${date},${etfCode},${symbol}`)].join(
    "\n"
  );
  const dir = join(rootDir, "data", "holdings", date);
  await mkdir(dir, { recursive: true });

  await writeFile(
    join(dir, `${etfCode}.csv`),
    `${csv}\n`,
    "utf8"
  );
}
