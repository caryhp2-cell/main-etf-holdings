import { describe, expect, it } from "vitest";

import { getRequestedDates } from "./scrape-goalstar";

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
