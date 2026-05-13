import { describe, expect, it, vi } from "vitest";

import { getMarketRetryDate, getRequestedDates, scrapeGoalStarHoldings } from "./scrape-goalstar";

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

  it("uses the current Taiwan date for --market-date after the first collection time", () => {
    expect(
      getRequestedDates(["--market-date"], () => new Date("2026-05-13T10:30:00.000Z"))
    ).toEqual(["2026-05-13"]);
  });

  it("keeps retrying the previous Taiwan trading date after midnight", () => {
    expect(
      getRequestedDates(["--market-date"], () => new Date("2026-05-13T16:30:00.000Z"))
    ).toEqual(["2026-05-13"]);
  });

  it("uses Friday as the retry trading date on Monday morning", () => {
    expect(getMarketRetryDate(new Date("2026-05-17T16:30:00.000Z"))).toBe("2026-05-15");
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

  it("continues writing available ETF data when one Goal Star API response is temporarily empty", async () => {
    const fetchJson = vi.fn(async (url: string) => {
      if (url.includes("00991A")) {
        return { items: [] };
      }

      return {
        items: [
          {
            date: "2026-05-13",
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
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await scrapeGoalStarHoldings({
      dates: ["2026-05-13"],
      fetchJson,
      writeCsv,
      now: () => new Date("2026-05-13T13:00:00.000Z"),
    });

    expect(writeCsv).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("No holdings rows parsed for 00991A")
    );

    warn.mockRestore();
  });

  it("skips existing CSV files when retrying missing holdings only", async () => {
    const fetchJson = vi.fn(async () => ({
      items: [
        {
          date: "2026-05-13",
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
    }));
    const writeCsv = vi.fn();

    await scrapeGoalStarHoldings({
      dates: ["2026-05-13"],
      fetchJson,
      fileExists: async (filePath) => !filePath.includes("00991A"),
      missingOnly: true,
      writeCsv,
      now: () => new Date("2026-05-13T13:00:00.000Z"),
    });

    expect(fetchJson).toHaveBeenCalledTimes(1);
    expect(writeCsv).toHaveBeenCalledTimes(1);
    expect(writeCsv).toHaveBeenCalledWith(expect.stringContaining("00991A.csv"), [
      expect.objectContaining({ etfCode: "00991A" }),
    ]);
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
