import { describe, expect, it } from "vitest";

import { formatChangePercent, formatShareDeltaLots } from "./formatHoldingValues";

describe("formatChangePercent", () => {
  it("rounds percentage values to 2 decimal places", () => {
    expect(formatChangePercent(2.6667)).toBe("2.67");
    expect(formatChangePercent(-0.2915)).toBe("-0.29");
  });

  it("keeps trailing zeros so percentages align visually", () => {
    expect(formatChangePercent(0.2)).toBe("0.20");
  });

  it("uses a dash when change percent is unavailable", () => {
    expect(formatChangePercent(null)).toBe("-");
  });
});

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
