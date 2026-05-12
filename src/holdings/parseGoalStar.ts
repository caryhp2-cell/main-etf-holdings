import * as cheerio from "cheerio";

import type { EtfCode, HoldingRow, HoldingStatus } from "./types";

interface ParseGoalStarHoldingsOptions {
  date: string;
  etfCode: EtfCode;
  sourceUrl: string;
  fetchedAt: string;
}

const STATUS_LABELS = new Set<HoldingStatus>([
  "新增",
  "加碼",
  "減碼",
  "不變",
  "未知",
]);

const REQUIRED_HEADERS = [
  "代號",
  "名稱",
  "股數",
  "權重",
  "收盤價",
  "漲跌",
  "異動",
  "狀態",
] as const;

export function parseGoalStarHoldings(
  html: string,
  options: ParseGoalStarHoldingsOptions
): HoldingRow[] {
  const $ = cheerio.load(html);
  const { table, headers } = findHoldingsTable($);

  return table
    .find("tbody tr")
    .map((_, row): HoldingRow => {
      const cells = $(row)
        .find("td")
        .map((_, cell) => $(cell).text().trim())
        .get();
      if (cells.length !== headers.length) {
        throw new Error(
          `Invalid Goal Star holdings row: expected ${headers.length} cells, received ${cells.length}`
        );
      }

      const value = (header: string) => cells[headers.indexOf(header)] ?? "";

      return {
        date: options.date,
        etfCode: options.etfCode,
        symbol: value("代號"),
        name: value("名稱"),
        shares: parseRequiredNumber(value("股數"), "股數"),
        weight: parseRequiredNumber(value("權重"), "權重"),
        closePrice: parseOptionalNumber(value("收盤價"), "收盤價"),
        changePercent: parseOptionalNumber(value("漲跌"), "漲跌"),
        shareDelta: parseOptionalNumber(value("異動"), "異動"),
        status: parseStatus(value("狀態")),
        sourceUrl: options.sourceUrl,
        fetchedAt: options.fetchedAt,
      };
    })
    .get();
}

function findHoldingsTable($: cheerio.CheerioAPI) {
  const candidates = $("table")
    .toArray()
    .map((element) => {
      const table = $(element);
      const headers = table
        .find("thead th")
        .map((_, header) => $(header).text().trim())
        .get();
      return { table, headers };
    });

  const table = candidates.find(({ headers }) =>
    REQUIRED_HEADERS.every((header) => headers.includes(header))
  );

  if (table) {
    return table;
  }

  const bestCandidate = candidates
    .slice()
    .sort(
      (left, right) =>
        countRequiredHeaders(right.headers) - countRequiredHeaders(left.headers)
    )[0];
  const bestHeaders = bestCandidate?.headers ?? [];
  const missingHeaders = REQUIRED_HEADERS.filter(
    (header) => !bestHeaders.includes(header)
  );

  throw new Error(
    `Missing required Goal Star holdings table header: ${missingHeaders.join(", ")}`
  );
}

function countRequiredHeaders(headers: string[]): number {
  return REQUIRED_HEADERS.filter((header) => headers.includes(header)).length;
}

function parseRequiredNumber(value: string, header: string): number {
  const parsed = parseNumber(value);

  if (parsed === null) {
    throw new Error(`Invalid required numeric value for ${header}: ${value}`);
  }

  return parsed;
}

function parseOptionalNumber(value: string, header: string): number | null {
  const parsed = parseNumber(value);

  if (parsed === null && !isBlankOptionalNumber(value)) {
    throw new Error(`Invalid optional numeric value for ${header}: ${value}`);
  }

  return parsed;
}

function parseNumber(value: string): number | null {
  if (isBlankOptionalNumber(value)) {
    return null;
  }

  const normalized = value
    .trim()
    .replaceAll(",", "")
    .replace("%", "")
    .replace(/^\+/, "");
  const number = Number(normalized);

  return Number.isFinite(number) ? number : null;
}

function isBlankOptionalNumber(value: string): boolean {
  const trimmed = value.trim();
  return trimmed === "" || trimmed === "-";
}

function parseStatus(value: string): HoldingStatus {
  return STATUS_LABELS.has(value as HoldingStatus)
    ? (value as HoldingStatus)
    : "未知";
}
