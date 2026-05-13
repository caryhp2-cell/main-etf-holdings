import { describe, expect, it } from "vitest";

import { formatShareDeltaLots } from "./formatHoldingValues";

describe("formatShareDeltaLots", () => {
  it("converts Goal Star share deltas into Taiwan trading lots", () => {
    expect(formatShareDeltaLots(298000)).toBe("298");
    expect(formatShareDeltaLots(-10565000)).toBe("-10,565");
  });

  it("keeps partial lots visible when share deltas are not multiples of 1000", () => {
    expect(formatShareDeltaLots(1500)).toBe("1.5");
  });

  it("uses a dash when share delta is unavailable", () => {
    expect(formatShareDeltaLots(null)).toBe("-");
  });
});
