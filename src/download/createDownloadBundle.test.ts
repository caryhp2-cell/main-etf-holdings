import { describe, expect, it } from "vitest";

import {
  buildDownloadFileName,
  getSelectedDownloadFiles,
  shouldCreateZip,
} from "./createDownloadBundle";

const files = [
  {
    date: "2026-05-12",
    etfCode: "00992A",
    path: "/data/holdings/2026-05-12/00992A.csv",
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
] as const;

describe("getSelectedDownloadFiles", () => {
  it("selects files by manifest path", () => {
    expect(
      getSelectedDownloadFiles(files, ["/data/holdings/2026-05-12/00991A.csv"])
    ).toEqual([files[1]]);
  });
});

describe("shouldCreateZip", () => {
  it("uses direct CSV for one file and zip for multiple files", () => {
    expect(shouldCreateZip([files[0]])).toBe(false);
    expect(shouldCreateZip([files[0], files[1]])).toBe(true);
  });
});

describe("buildDownloadFileName", () => {
  it("builds the expected zip archive name", () => {
    expect(buildDownloadFileName("2026-05-12", "zip")).toBe(
      "main-etf-holdings-2026-05-12.zip"
    );
  });

  it("uses the ETF code for a single CSV file name", () => {
    expect(buildDownloadFileName("2026-05-12", "csv", files[0])).toBe("00992A.csv");
  });
});
