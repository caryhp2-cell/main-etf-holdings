import { strToU8, zipSync } from "fflate";

import type { HoldingsManifestFile } from "../holdings/loadManifest";
import type { EtfCode } from "../holdings/types";

export function getRecentDownloadFiles<T extends HoldingsManifestFile>(
  files: readonly T[],
  etfCodes: readonly EtfCode[],
  limitDays = 30
): T[] {
  const recentDates = new Set(
    [...new Set(files.map((file) => file.date))].sort().slice(-limitDays)
  );
  const etfOrder = new Map(etfCodes.map((etfCode, index) => [etfCode, index]));

  return files
    .filter((file) => recentDates.has(file.date) && etfOrder.has(file.etfCode))
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        (etfOrder.get(a.etfCode) ?? 0) - (etfOrder.get(b.etfCode) ?? 0)
    );
}

export function buildRecentDownloadFileName(): string {
  return "main-etf-holdings-recent-30-days.zip";
}

export function createZipBlob(files: Array<{ fileName: string; content: string }>): Blob {
  const zipped = zipSync(
    Object.fromEntries(files.map((file) => [file.fileName, strToU8(file.content)]))
  );
  const bytes = new Uint8Array(zipped);
  const arrayBuffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;

  return new Blob([arrayBuffer], { type: "application/zip" });
}
