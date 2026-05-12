import { fileURLToPath } from "node:url";
import { join } from "node:path";

import { parseGoalStarHoldings } from "../src/holdings/parseGoalStar";
import { ETF_CODES, type EtfCode, type HoldingRow } from "../src/holdings/types";
import { writeHoldingsCsv } from "../src/holdings/writeCsv";

const GOAL_STAR_BASE_URL = "https://goal-star.com/fund";

interface ScrapeOptions {
  dates: string[];
  fetchHtml?: (url: string) => Promise<string>;
  now?: () => Date;
}

export function getRequestedDates(
  args: string[],
  now: () => Date = () => new Date()
): string[] {
  const flags = parseFlags(args);

  if (flags.today) {
    if (flags.from || flags.to) {
      throw new Error("Use either --today or --from/--to, not both.");
    }
    return [formatLocalDate(now())];
  }

  if (!flags.from || !flags.to) {
    throw new Error("Expected --today or --from YYYY-MM-DD --to YYYY-MM-DD.");
  }

  return enumerateDateRange(flags.from, flags.to);
}

export async function scrapeGoalStarHoldings({
  dates,
  fetchHtml = fetchGoalStarHtml,
  now = () => new Date(),
}: ScrapeOptions): Promise<void> {
  for (const date of dates) {
    for (const etfCode of ETF_CODES) {
      const sourceUrl = goalStarFundUrl(etfCode);
      const html = await fetchHtml(sourceUrl);
      const rows = parseRowsOrThrow(html, {
        date,
        etfCode,
        sourceUrl,
        fetchedAt: now().toISOString(),
      });
      const filePath = join(process.cwd(), "data", "holdings", date, `${etfCode}.csv`);

      await writeHoldingsCsv(filePath, rows);
      console.log(`Wrote ${rows.length} rows to ${filePath}`);
    }
  }
}

function parseRowsOrThrow(
  html: string,
  options: {
    date: string;
    etfCode: EtfCode;
    sourceUrl: string;
    fetchedAt: string;
  }
): HoldingRow[] {
  try {
    const rows = parseGoalStarHoldings(html, options);
    if (rows.length === 0) {
      throw new Error("Parsed holdings table contained zero rows.");
    }
    return rows;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`No holdings rows parsed for ${options.etfCode}: ${message}`);
  }
}

async function fetchGoalStarHtml(url: string): Promise<string> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

function goalStarFundUrl(etfCode: EtfCode): string {
  return `${GOAL_STAR_BASE_URL}/${etfCode}`;
}

function parseFlags(args: string[]): {
  today: boolean;
  from?: string;
  to?: string;
} {
  const flags: { today: boolean; from?: string; to?: string } = { today: false };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--today") {
      flags.today = true;
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

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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

async function main(): Promise<void> {
  const dates = getRequestedDates(process.argv.slice(2));
  await scrapeGoalStarHoldings({ dates });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
