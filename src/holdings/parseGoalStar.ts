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

export function parseGoalStarHoldings(
  html: string,
  options: ParseGoalStarHoldingsOptions
): HoldingRow[] {
  const $ = cheerio.load(html);
  const table = $("table").first();
  const headers = table
    .find("thead th")
    .map((_, element) => $(element).text().trim())
    .get();

  return table
    .find("tbody tr")
    .map((_, row): HoldingRow => {
      const cells = $(row)
        .find("td")
        .map((_, cell) => $(cell).text().trim())
        .get();
      const value = (header: string) => cells[headers.indexOf(header)] ?? "";

      return {
        date: options.date,
        etfCode: options.etfCode,
        symbol: value("代號"),
        name: value("名稱"),
        shares: parseNumber(value("股數")),
        weight: parseNumber(value("權重")),
        closePrice: parseNumber(value("收盤價")),
        changePercent: parseNumber(value("漲跌")),
        shareDelta: parseNumber(value("異動")),
        status: parseStatus(value("狀態")),
        sourceUrl: options.sourceUrl,
        fetchedAt: options.fetchedAt,
      };
    })
    .get();
}

function parseNumber(value: string): number {
  return Number(value.replaceAll(",", "").replace("%", "").replace("+", ""));
}

function parseStatus(value: string): HoldingStatus {
  return STATUS_LABELS.has(value as HoldingStatus)
    ? (value as HoldingStatus)
    : "未知";
}
