import { describe, expect, it } from "vitest";

import { findRepeatedActionSymbols } from "../src/holdings/repeatedActionSymbols";
import type { HoldingRow } from "../src/holdings/types";

const baseRow: HoldingRow = {
  date: "2026-05-12",
  etfCode: "00981A",
  symbol: "2330",
  name: "台積電",
  shares: 1000,
  weight: 1,
  closePrice: 100,
  changePercent: 0,
  shareDelta: 0,
  status: "不變",
  sourceUrl: "https://example.com",
  fetchedAt: "2026-05-12T00:00:00.000Z",
};

describe("findRepeatedActionSymbols", () => {
  it("returns action keys that appear more than once with the same 加碼 or 減碼 status", () => {
    const symbols = findRepeatedActionSymbols({
      "00981A": [
        { ...baseRow, etfCode: "00981A", symbol: "6669", status: "加碼" },
        { ...baseRow, etfCode: "00981A", symbol: "2330", status: "不變" },
      ],
      "00991A": [
        { ...baseRow, etfCode: "00991A", symbol: "6669", status: "加碼" },
        { ...baseRow, etfCode: "00991A", symbol: "2383", status: "減碼" },
      ],
      "00992A": [
        { ...baseRow, etfCode: "00992A", symbol: "2383", status: "減碼" },
        { ...baseRow, etfCode: "00992A", symbol: "2330", status: "不變" },
      ],
    });

    expect([...symbols].sort()).toEqual(["2383:減碼", "6669:加碼"]);
  });

  it("ignores mixed 加碼 and 減碼 rows for the same symbol", () => {
    const symbols = findRepeatedActionSymbols({
      "00981A": [
        { ...baseRow, etfCode: "00981A", symbol: "2308", name: "台達電", status: "加碼" },
      ],
      "00991A": [
        { ...baseRow, etfCode: "00991A", symbol: "2308", name: "台達電", status: "減碼" },
      ],
      "00992A": [],
    });

    expect(symbols).toEqual(new Set());
  });

  it("ignores single action rows and repeated non-action rows", () => {
    const symbols = findRepeatedActionSymbols({
      "00981A": [
        { ...baseRow, etfCode: "00981A", symbol: "6669", status: "加碼" },
        { ...baseRow, etfCode: "00981A", symbol: "2330", status: "不變" },
      ],
      "00991A": [{ ...baseRow, etfCode: "00991A", symbol: "2330", status: "不變" }],
      "00992A": [{ ...baseRow, etfCode: "00992A", symbol: "2330", status: "不變" }],
    });

    expect(symbols).toEqual(new Set());
  });
});
