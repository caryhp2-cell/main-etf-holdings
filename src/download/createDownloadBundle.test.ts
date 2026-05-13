import { describe, expect, it } from "vitest";

import {
  buildRecentDownloadFileName,
  getRecentDownloadFiles,
} from "./createDownloadBundle";

const files = [
  {
    date: "2026-05-12",
    etfCode: "00981A",
    path: "/data/holdings/2026-05-12/00981A.csv",
    rowCount: 45,
  },
  {
    date: "2026-05-12",
    etfCode: "00991A",
    path: "/data/holdings/2026-05-12/00991A.csv",
    rowCount: 50,
  },
  {
    date: "2026-05-11",
    etfCode: "00992A",
    path: "/data/holdings/2026-05-11/00992A.csv",
    rowCount: 45,
  },
  {
    date: "2026-04-01",
    etfCode: "00991A",
    path: "/data/holdings/2026-04-01/00991A.csv",
    rowCount: 50,
  },
] as const;

describe("getRecentDownloadFiles", () => {
  it("selects the requested ETF files from the latest available dates", () => {
    expect(getRecentDownloadFiles(files, ["00981A", "00992A", "00991A"], 2)).toEqual([
      files[2],
      files[0],
      files[1],
    ]);
  });
});

describe("buildRecentDownloadFileName", () => {
  it("builds the recent 30 days archive name", () => {
    expect(buildRecentDownloadFileName()).toBe("main-etf-holdings-recent-30-days.zip");
  });
});
