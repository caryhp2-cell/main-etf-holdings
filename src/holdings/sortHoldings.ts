import type { HoldingRow, HoldingStatus } from "./types";

export type SortKey = "weight" | "changePercent" | "status";
export type SortDirection = "asc" | "desc";

export interface HoldingsSort {
  key: SortKey;
  direction: SortDirection;
}

const STATUS_ORDER: Record<HoldingStatus, number> = {
  新增: 0,
  加碼: 1,
  減碼: 2,
  不變: 3,
  未知: 4,
};

export function sortHoldingsRows(
  rows: readonly HoldingRow[],
  sort: HoldingsSort
): HoldingRow[] {
  return [...rows].sort((left, right) => {
    const result = compareRows(left, right, sort.key);
    return sort.direction === "asc" ? result : -result;
  });
}

function compareRows(left: HoldingRow, right: HoldingRow, key: SortKey): number {
  if (key === "status") {
    return STATUS_ORDER[left.status] - STATUS_ORDER[right.status];
  }

  return compareNullableNumbers(left[key], right[key]);
}

function compareNullableNumbers(left: number | null, right: number | null): number {
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;
  return left - right;
}
