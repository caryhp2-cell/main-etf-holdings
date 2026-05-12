import { describe, expect, it } from "vitest";

import { transformGoalStarApiItems } from "./transformGoalStarApi";

describe("transformGoalStarApiItems", () => {
  const options = {
    etfCode: "00992A" as const,
    sourceUrl: "https://goal-star.com/fund/00992A",
    fetchedAt: "2026-05-12T13:00:00.000Z",
  };

  it("maps Goal Star API items to holding rows", () => {
    const rows = transformGoalStarApiItems(
      [
        {
          date: "2026-05-12",
          stock_symbol: "2330",
          stock_name: "台積電",
          shares: 1761000,
          ratio: "7.460000",
          diff: 0,
          status: "unchanged",
          close: "2255.0000",
          change: "0.8949",
        },
        {
          date: "2026-05-12",
          stock_symbol: "2317",
          stock_name: "鴻海",
          shares: "120,000",
          ratio: "3.5",
          diff: "-1000",
          status: "decrease",
          close: null,
          change: "",
        },
      ],
      options
    );

    expect(rows).toEqual([
      {
        date: "2026-05-12",
        etfCode: "00992A",
        symbol: "2330",
        name: "台積電",
        shares: 1761000,
        weight: 7.46,
        closePrice: 2255,
        changePercent: 0.8949,
        shareDelta: 0,
        status: "不變",
        sourceUrl: "https://goal-star.com/fund/00992A",
        fetchedAt: "2026-05-12T13:00:00.000Z",
      },
      {
        date: "2026-05-12",
        etfCode: "00992A",
        symbol: "2317",
        name: "鴻海",
        shares: 120000,
        weight: 3.5,
        closePrice: null,
        changePercent: null,
        shareDelta: -1000,
        status: "減碼",
        sourceUrl: "https://goal-star.com/fund/00992A",
        fetchedAt: "2026-05-12T13:00:00.000Z",
      },
    ]);
  });

  it("uses unknown status for API statuses outside the CSV contract", () => {
    const [row] = transformGoalStarApiItems(
      [
        {
          date: "2026-05-12",
          stock_symbol: "9999",
          stock_name: "清倉標的",
          shares: 0,
          ratio: "0",
          diff: -1000,
          status: "clear",
          close: "10",
          change: "-1",
        },
      ],
      options
    );

    expect(row.status).toBe("未知");
  });

  it("throws when a required API value is invalid", () => {
    expect(() =>
      transformGoalStarApiItems(
        [
          {
            date: "2026-05-12",
            stock_symbol: "2330",
            stock_name: "台積電",
            shares: "",
            ratio: "7.460000",
            diff: 0,
            status: "unchanged",
            close: "2255.0000",
            change: "0.8949",
          },
        ],
        options
      )
    ).toThrow(/Invalid required Goal Star API value for shares/);
  });
});
