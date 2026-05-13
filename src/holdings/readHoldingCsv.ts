import { access } from "node:fs/promises";
import { join } from "node:path";

import { ETF_CODES, type EtfCode } from "./types";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

interface ResolveHoldingCsvPathOptions {
  rootDir?: string;
  date: string;
  etfCodeParam: string;
}

export async function resolveHoldingCsvPath({
  rootDir = process.cwd(),
  date,
  etfCodeParam,
}: ResolveHoldingCsvPathOptions): Promise<string> {
  if (!DATE_PATTERN.test(date)) {
    throw new Error(`Invalid holdings date: ${date}`);
  }

  const etfCode = parseEtfCodeParam(etfCodeParam);
  const filePath = join(rootDir, "data", "holdings", date, `${etfCode}.csv`);

  await access(filePath);

  return filePath;
}

export function getHoldingCsvResponseHeaders(fileName: string): Record<string, string> {
  return {
    "content-disposition": `attachment; filename="${fileName}"`,
    "content-type": "text/csv; charset=utf-8",
  };
}

function parseEtfCodeParam(etfCodeParam: string): EtfCode {
  if (!etfCodeParam.endsWith(".csv")) {
    throw new Error(`Invalid ETF CSV file: ${etfCodeParam}`);
  }

  const etfCode = etfCodeParam.slice(0, -4);
  if (!ETF_CODES.includes(etfCode as EtfCode)) {
    throw new Error(`Invalid ETF CSV file: ${etfCodeParam}`);
  }

  return etfCode as EtfCode;
}
