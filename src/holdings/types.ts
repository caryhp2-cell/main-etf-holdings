export const ETF_CODES = ["00981A", "00992A", "00991A"] as const;
export const DISPLAY_ETF_CODES = ["00991A", "00992A", "00981A"] as const;

export type EtfCode = (typeof ETF_CODES)[number];

export type HoldingStatus = "新增" | "加碼" | "減碼" | "不變" | "未知";

export interface HoldingRow {
  date: string;
  etfCode: EtfCode;
  symbol: string;
  name: string;
  shares: number;
  weight: number;
  closePrice: number | null;
  changePercent: number | null;
  shareDelta: number | null;
  status: HoldingStatus;
  sourceUrl: string;
  fetchedAt: string;
}
