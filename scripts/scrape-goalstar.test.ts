import { describe, expect, it, vi } from "vitest";

import { getRequestedDates, scrapeGoalStarHoldings } from "./scrape-goalstar";

describe("getRequestedDates", () => {
  it("uses the supplied local today value for --today", () => {
    expect(
      getRequestedDates(["--today"], () => new Date("2026-05-12T23:30:00+08:00"))
    ).toEqual(["2026-05-12"]);
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
        /^https:\/\/goal-star\.com\/api\/funds\/(?:00992A|00991A|00985A|00981A)\/shares\?date=2026-05-12$/
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

    expect(fetchJson).toHaveBeenCalledTimes(4);
    expect(writeCsv).toHaveBeenCalledTimes(4);
    expect(writeCsv).toHaveBeenCalledWith(
      expect.stringContaining("00992A.csv"),
      [
        expect.objectContaining({
          etfCode: "00992A",
          sourceUrl: "https://goal-star.com/fund/00992A",
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
    ).rejects.toThrow(/No holdings rows parsed for 00992A/);
  });

  it("fails loudly when Goal Star API payload is invalid", async () => {
    await expect(
      scrapeGoalStarHoldings({
        dates: ["2026-05-12"],
        fetchJson: async () => ({ rows: [] }),
        writeCsv: vi.fn(),
      })
    ).rejects.toThrow(/No holdings rows parsed for 00992A/);
  });
});
