import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { access } from "node:fs/promises";

import {
  transformGoalStarApiItems,
  type GoalStarApiItem,
} from "../src/holdings/transformGoalStarApi";
import { ETF_CODES, type EtfCode, type HoldingRow } from "../src/holdings/types";
import { writeHoldingsCsv } from "../src/holdings/writeCsv";

const GOAL_STAR_BASE_URL = "https://goal-star.com/fund";
const GOAL_STAR_API_BASE_URL = "https://goal-star.com/api/funds";

interface ScrapeOptions {
  dates: string[];
  missingOnly?: boolean;
  fileExists?: (filePath: string) => Promise<boolean>;
  fetchJson?: (url: string) => Promise<unknown>;
  now?: () => Date;
  writeCsv?: (filePath: string, rows: HoldingRow[]) => Promise<void>;
}

export function getRequestedDates(
  args: string[],
  now: () => Date = () => new Date()
): string[] {
  const flags = parseFlags(args);

  if (flags.today || flags.marketDate) {
    if (flags.from || flags.to || (flags.today && flags.marketDate)) {
      throw new Error("Use only one date mode: --today, --market-date, or --from/--to.");
    }
    return [flags.marketDate ? getMarketRetryDate(now()) : formatTaiwanDate(now())];
  }

  if (!flags.from || !flags.to) {
    throw new Error("Expected --today or --from YYYY-MM-DD --to YYYY-MM-DD.");
  }

  return enumerateDateRange(flags.from, flags.to);
}

export async function scrapeGoalStarHoldings({
  dates,
  missingOnly = false,
  fileExists = pathExists,
  fetchJson = fetchGoalStarJson,
  now = () => new Date(),
  writeCsv = writeHoldingsCsv,
}: ScrapeOptions): Promise<void> {
  for (const date of dates) {
    const failures: string[] = [];
    let skippedFiles = 0;
    let writtenFiles = 0;

    for (const etfCode of ETF_CODES) {
      const filePath = join(process.cwd(), "data", "holdings", date, `${etfCode}.csv`);

      if (missingOnly && (await fileExists(filePath))) {
        skippedFiles += 1;
        console.log(`Skipped existing ${filePath}`);
        continue;
      }

      const sourceUrl = goalStarFundUrl(etfCode);
      const apiUrl = goalStarSharesApiUrl(etfCode, date);
      let rows: HoldingRow[];

      try {
        const payload = await fetchJson(apiUrl);
        rows = parseRowsOrThrow(payload, {
          date,
          etfCode,
          sourceUrl,
          fetchedAt: now().toISOString(),
          requestedDate: date,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failures.push(message);
        console.warn(message);
        continue;
      }

      await writeCsv(filePath, rows);
      writtenFiles += 1;
      console.log(`Wrote ${rows.length} rows to ${filePath}`);
    }

    if (writtenFiles === 0 && skippedFiles === 0) {
      throw new Error(failures.join("\n") || `No holdings rows written for ${date}.`);
    }
  }
}

function parseRowsOrThrow(
  payload: unknown,
  options: {
    date: string;
    etfCode: EtfCode;
    sourceUrl: string;
    fetchedAt: string;
    requestedDate: string;
  }
): HoldingRow[] {
  try {
    const rows = transformGoalStarApiItems(parseApiItems(payload), options);
    if (rows.length === 0) {
      throw new Error("Goal Star API payload contained zero items.");
    }
    return rows;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`No holdings rows parsed for ${options.etfCode}: ${message}`);
  }
}

function parseApiItems(payload: unknown): GoalStarApiItem[] {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("items" in payload) ||
    !Array.isArray(payload.items)
  ) {
    throw new Error("Goal Star API payload missing items array.");
  }

  return payload.items as GoalStarApiItem[];
}

async function fetchGoalStarJson(url: string): Promise<unknown> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function goalStarFundUrl(etfCode: EtfCode): string {
  return `${GOAL_STAR_BASE_URL}/${etfCode}`;
}

function goalStarSharesApiUrl(etfCode: EtfCode, date: string): string {
  return `${GOAL_STAR_API_BASE_URL}/${etfCode}/shares?date=${date}`;
}

function parseFlags(args: string[]): {
  today: boolean;
  marketDate: boolean;
  missingOnly: boolean;
  from?: string;
  to?: string;
} {
  const flags: {
    today: boolean;
    marketDate: boolean;
    missingOnly: boolean;
    from?: string;
    to?: string;
  } = {
    today: false,
    marketDate: false,
    missingOnly: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--today") {
      flags.today = true;
    } else if (arg === "--market-date") {
      flags.marketDate = true;
    } else if (arg === "--missing-only") {
      flags.missingOnly = true;
    } else if (arg === "--from") {
      flags.from = args[index + 1];
      index += 1;
    } else if (arg === "--to") {
      flags.to = args[index + 1];
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return flags;
}

function getMissingOnly(args: string[]): boolean {
  return parseFlags(args).missingOnly;
}

export function getMarketRetryDate(now: Date): string {
  const parts = getTaiwanDateTimeParts(now);
  const date = parseDateOnly(parts.date, "Taiwan date");

  if (parts.hour >= 18) {
    return parts.date;
  }

  return formatDateOnly(previousBusinessDay(date));
}

function formatTaiwanDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function enumerateDateRange(from: string, to: string): string[] {
  const start = parseDateOnly(from, "--from");
  const end = parseDateOnly(to, "--to");

  if (start.getTime() > end.getTime()) {
    throw new Error("--from must be on or before --to.");
  }

  const dates: string[] = [];
  for (
    let cursor = start;
    cursor.getTime() <= end.getTime();
    cursor = addUtcDays(cursor, 1)
  ) {
    dates.push(cursor.toISOString().slice(0, 10));
  }

  return dates;
}

function parseDateOnly(value: string, flagName: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${flagName} must be formatted YYYY-MM-DD.`);
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error(`${flagName} must be a valid calendar date.`);
  }

  return date;
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function previousBusinessDay(date: Date): Date {
  let cursor = addUtcDays(date, -1);

  while (cursor.getUTCDay() === 0 || cursor.getUTCDay() === 6) {
    cursor = addUtcDays(cursor, -1);
  }

  return cursor;
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getTaiwanDateTimeParts(date: Date): { date: string; hour: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";

  return {
    date: `${part("year")}-${part("month")}-${part("day")}`,
    hour: Number(part("hour")),
  };
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return false;
    }

    throw error;
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dates = getRequestedDates(args);
  await scrapeGoalStarHoldings({ dates, missingOnly: getMissingOnly(args) });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
