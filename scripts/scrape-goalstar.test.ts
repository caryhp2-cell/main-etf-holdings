import { describe, expect, it, vi } from "vitest";

import { getRequestedDates, scrapeGoalStarHoldings } from "./scrape-goalstar";

describe("getRequestedDates", () => {
  it("uses the supplied local today value for --today", () => {
    expect(
      getRequestedDates(["--today"], () => new Date("2026-05-12T23:30:00+08:00"))
    ).toEqual(["2026-05-12"]);
  });

  it("formats --today using the Taiwan market date", () => {
    const originalTimeZone = process.env.TZ;
    process.env.TZ = "UTC";

    try {
      expect(
        getRequestedDates(["--today"], () => new Date("2026-05-11T16:30:00.000Z"))
      ).toEqual(["2026-05-12"]);
    } finally {
      if (originalTimeZone === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = originalTimeZone;
      }
    }
  });

  it("iterates inclusive calendar dates from --from to --to", () => {
    expect(
      getRequestedDates(["--from", "2026-05-01", "--to", "2026-05-03"])
    ).toEqual(["2026-05-01", "2026-05-02", "2026-05-03"]);
  });

  it("throws a clear error when the date range is reversed", () => {
    expect(() =>
      getRequestedDates(["--from", "2026-05-12", "--to", "2026-05-01"])
    ).toThrow(/--from must be on or before --to/);
  });
});

describe("scrapeGoalStarHoldings", () => {
  it("fetches dated Goal Star API URLs and writes rows with public fund source URLs", async () => {
    const fetchJson = vi.fn(async (url: string) => {
      expect(url).toMatch(
        /^https:\/\/goal-star\.com\/api\/funds\/(?:00981A|00992A|00991A)\/shares\?date=2026-05-12$/
      );

      return {
        items: [
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
        ],
      };
    });
    const writeCsv = vi.fn();

    await scrapeGoalStarHoldings({
      dates: ["2026-05-12"],
      fetchJson,
      writeCsv,
      now: () => new Date("2026-05-12T13:00:00.000Z"),
    });

    expect(fetchJson).toHaveBeenCalledTimes(3);
    expect(writeCsv).toHaveBeenCalledTimes(3);
    expect(writeCsv).toHaveBeenCalledWith(
      expect.stringContaining("00981A.csv"),
      [
        expect.objectContaining({
          etfCode: "00981A",
          sourceUrl: "https://goal-star.com/fund/00981A",
          status: "不變",
        }),
      ]
    );
  });

  it("fails loudly when Goal Star API items are empty", async () => {
    await expect(
      scrapeGoalStarHoldings({
        dates: ["2026-05-12"],
        fetchJson: async () => ({ items: [] }),
        writeCsv: vi.fn(),
      })
    ).rejects.toThrow(/No holdings rows parsed for 00981A/);
  });

  it("fails loudly when Goal Star API payload is invalid", async () => {
    await expect(
      scrapeGoalStarHoldings({
        dates: ["2026-05-12"],
        fetchJson: async () => ({ rows: [] }),
        writeCsv: vi.fn(),
      })
    ).rejects.toThrow(/No holdings rows parsed for 00981A/);
  });
});
