import type { EtfCode, HoldingRow, HoldingStatus } from "./types";

const REPEATED_ACTION_STATUSES = new Set(["加碼", "減碼"]);

export function findRepeatedActionSymbols(holdingsByEtf: Record<EtfCode, HoldingRow[]>): Set<string> {
  const actionCounts = new Map<string, number>();

  for (const rows of Object.values(holdingsByEtf)) {
    for (const row of rows) {
      if (!REPEATED_ACTION_STATUSES.has(row.status)) continue;
      const actionKey = toRepeatedActionKey(row.symbol, row.status);
      actionCounts.set(actionKey, (actionCounts.get(actionKey) ?? 0) + 1);
    }
  }

  return new Set(
    [...actionCounts.entries()]
      .filter(([, count]) => count > 1)
      .map(([symbol]) => symbol)
  );
}

export function toRepeatedActionKey(symbol: string, status: HoldingStatus): string {
  return `${symbol}:${status}`;
}
