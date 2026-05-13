"use client";

import { useState } from "react";

import { sortHoldingsRows, type HoldingsSort, type SortKey } from "../holdings/sortHoldings";
import { DISPLAY_ETF_CODES, type EtfCode, type HoldingRow } from "../holdings/types";
import { EtfHoldingsColumn } from "./EtfHoldingsColumn";

interface HoldingsDashboardProps {
  holdingsByEtf: Record<EtfCode, HoldingRow[]>;
}

export function HoldingsDashboard({ holdingsByEtf }: HoldingsDashboardProps) {
  const [sort, setSort] = useState<HoldingsSort>({
    key: "weight",
    direction: "desc",
  });

  function requestSort(key: SortKey) {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === "desc" ? "asc" : "desc",
    }));
  }

  return (
    <section className="holdings-grid" aria-label="ETF holdings comparison">
      {DISPLAY_ETF_CODES.map((etfCode) => (
        <EtfHoldingsColumn
          key={etfCode}
          etfCode={etfCode}
          rows={sortHoldingsRows(holdingsByEtf[etfCode], sort)}
          sort={sort}
          onSort={requestSort}
        />
      ))}
    </section>
  );
}
