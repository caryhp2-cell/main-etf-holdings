import { describe, expect, it } from "vitest";

import { sortHoldingsRows } from "./sortHoldings";
import type { HoldingRow } from "./types";

const baseRow: HoldingRow = {
  date: "2026-05-12",
  etfCode: "00992A",
  symbol: "2330",
  name: "台積電",
  shares: 1,
  weight: 1,
  closePrice: 1,
  changePercent: 1,
  shareDelta: 1,
  status: "不變",
  sourceUrl: "https://goal-star.com/fund/00992A",
  fetchedAt: "2026-05-12T00:00:00.000Z",
};

describe("sortHoldingsRows", () => {
  it("sorts by weight descending", () => {
    const rows = [
      { ...baseRow, symbol: "A", weight: 1 },
      { ...baseRow, symbol: "B", weight: 3 },
      { ...baseRow, symbol: "C", weight: 2 },
    ];

    expect(sortHoldingsRows(rows, { key: "weight", direction: "desc" }).map((row) => row.symbol)).toEqual([
      "B",
      "C",
      "A",
    ]);
  });

  it("sorts by changePercent ascending with null values last", () => {
    const rows = [
      { ...baseRow, symbol: "A", changePercent: 1 },
      { ...baseRow, symbol: "B", changePercent: null },
      { ...baseRow, symbol: "C", changePercent: -2 },
    ];

    expect(
      sortHoldingsRows(rows, { key: "changePercent", direction: "asc" }).map((row) => row.symbol)
    ).toEqual(["C", "A", "B"]);
  });

  it("sorts status by action priority", () => {
    const rows = [
      { ...baseRow, symbol: "A", status: "不變" },
      { ...baseRow, symbol: "B", status: "減碼" },
      { ...baseRow, symbol: "C", status: "加碼" },
      { ...baseRow, symbol: "D", status: "新增" },
    ];

    expect(sortHoldingsRows(rows, { key: "status", direction: "asc" }).map((row) => row.symbol)).toEqual([
      "D",
      "C",
      "B",
      "A",
    ]);
  });
});
