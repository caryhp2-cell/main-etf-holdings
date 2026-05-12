import type { EtfCode, HoldingRow, HoldingStatus } from "./types";

export interface GoalStarApiItem {
  date: unknown;
  stock_symbol: unknown;
  stock_name: unknown;
  shares: unknown;
  ratio: unknown;
  diff: unknown;
  status: unknown;
  close: unknown;
  change: unknown;
}

interface TransformGoalStarApiItemsOptions {
  etfCode: EtfCode;
  sourceUrl: string;
  fetchedAt: string;
  requestedDate: string;
}

const STATUS_BY_API_VALUE: Record<string, HoldingStatus> = {
  new: "新增",
  increase: "加碼",
  decrease: "減碼",
  unchanged: "不變",
};

export function transformGoalStarApiItems(
  items: GoalStarApiItem[],
  options: TransformGoalStarApiItemsOptions
): HoldingRow[] {
  return items.map((item) => {
    validateItemDate(item.date, options.requestedDate);

    return {
      date: options.requestedDate,
      etfCode: options.etfCode,
      symbol: parseRequiredString(item.stock_symbol, "stock_symbol"),
      name: parseRequiredString(item.stock_name, "stock_name"),
      shares: parseRequiredNumber(item.shares, "shares"),
      weight: parseRequiredNumber(item.ratio, "ratio"),
      closePrice: parseOptionalNumber(item.close, "close"),
      changePercent: parseOptionalNumber(item.change, "change"),
      shareDelta: parseOptionalNumber(item.diff, "diff"),
      status: parseStatus(item.status),
      sourceUrl: options.sourceUrl,
      fetchedAt: options.fetchedAt,
    };
  });
}

function validateItemDate(value: unknown, requestedDate: string): void {
  const itemDate = parseRequiredString(value, "date");

  if (!isValidDateOnly(itemDate)) {
    throw new Error(`Invalid required Goal Star API value for date: ${String(value)}`);
  }

  if (itemDate !== requestedDate) {
    throw new Error(
      `Goal Star API item date ${itemDate} did not match requested date ${requestedDate}`
    );
  }
}

function parseRequiredString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Invalid required Goal Star API value for ${fieldName}: ${String(value)}`);
  }

  return value.trim();
}

function parseRequiredNumber(value: unknown, fieldName: string): number {
  const parsed = parseNumber(value);

  if (parsed === null) {
    throw new Error(`Invalid required Goal Star API value for ${fieldName}: ${String(value)}`);
  }

  return parsed;
}

function parseOptionalNumber(value: unknown, fieldName: string): number | null {
  const parsed = parseNumber(value);

  if (parsed === null && !isBlankOptionalNumber(value)) {
    throw new Error(`Invalid optional Goal Star API value for ${fieldName}: ${String(value)}`);
  }

  return parsed;
}

function parseNumber(value: unknown): number | null {
  if (isBlankOptionalNumber(value)) {
    return null;
  }

  const normalized = String(value).trim().replaceAll(",", "").replace("%", "");
  const number = Number(normalized);

  return Number.isFinite(number) ? number : null;
}

function isBlankOptionalNumber(value: unknown): boolean {
  return value === null || value === undefined || String(value).trim() === "";
}

function parseStatus(value: unknown): HoldingStatus {
  if (typeof value !== "string") {
    return "未知";
  }

  return STATUS_BY_API_VALUE[value] ?? "未知";
}

function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
