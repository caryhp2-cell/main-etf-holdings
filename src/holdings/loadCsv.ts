import { readFile } from "node:fs/promises";
import { join } from "node:path";

import Papa from "papaparse";

import type { EtfCode, HoldingRow, HoldingStatus } from "./types";

interface LoadHoldingsCsvOptions {
  rootDir?: string;
  date: string;
  etfCode: EtfCode;
}

interface CsvHoldingRow {
  date: string;
  etfCode: EtfCode;
  symbol: string;
  name: string;
  shares: string;
  weight: string;
  closePrice: string;
  changePercent: string;
  shareDelta: string;
  status: HoldingStatus;
  sourceUrl: string;
  fetchedAt: string;
}

export async function loadHoldingsCsv({
  rootDir = process.cwd(),
  date,
  etfCode,
}: LoadHoldingsCsvOptions): Promise<HoldingRow[]> {
  const filePath = join(rootDir, "data", "holdings", date, `${etfCode}.csv`);

  try {
    const csv = await readFile(filePath, "utf8");
    const parsed = Papa.parse<CsvHoldingRow>(csv, {
      header: true,
      skipEmptyLines: true,
    });

    return parsed.data.map((row) => ({
      date: row.date,
      etfCode: row.etfCode,
      symbol: row.symbol,
      name: row.name,
      shares: Number(row.shares),
      weight: Number(row.weight),
      closePrice: parseNullableNumber(row.closePrice),
      changePercent: parseNullableNumber(row.changePercent),
      shareDelta: parseNullableNumber(row.shareDelta),
      status: row.status,
      sourceUrl: row.sourceUrl,
      fetchedAt: row.fetchedAt,
    }));
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return [];
    }

    throw error;
  }
}

function parseNullableNumber(value: string): number | null {
  return value === "" ? null : Number(value);
}
