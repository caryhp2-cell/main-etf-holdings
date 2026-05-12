import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import Papa from "papaparse";

import type { HoldingRow } from "./types";

const HOLDINGS_CSV_FIELDS = [
  "date",
  "etfCode",
  "symbol",
  "name",
  "shares",
  "weight",
  "closePrice",
  "changePercent",
  "shareDelta",
  "status",
  "sourceUrl",
  "fetchedAt",
] satisfies Array<keyof HoldingRow>;

export async function writeHoldingsCsv(
  filePath: string,
  rows: HoldingRow[]
): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });

  const csv = Papa.unparse(rows, {
    columns: HOLDINGS_CSV_FIELDS,
    header: true,
    newline: "\n",
  });

  await writeFile(filePath, `${csv}\n`, "utf8");
}
