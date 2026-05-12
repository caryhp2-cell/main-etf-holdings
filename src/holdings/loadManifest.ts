import manifest from "../../data/manifest.json";

import type { EtfCode } from "./types";

export interface HoldingsManifestFile {
  date: string;
  etfCode: EtfCode;
  path: string;
  rowCount: number;
}

export interface HoldingsManifest {
  generatedAt: string;
  etfs: EtfCode[];
  dates: string[];
  files: HoldingsManifestFile[];
}

export function loadManifest(): HoldingsManifest {
  return manifest as HoldingsManifest;
}

export type { EtfCode };
