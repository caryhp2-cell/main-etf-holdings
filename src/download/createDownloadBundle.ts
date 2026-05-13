import { strToU8, zipSync } from "fflate";

import type { HoldingsManifestFile } from "../holdings/loadManifest";

export function getSelectedDownloadFiles<T extends HoldingsManifestFile>(
  files: readonly T[],
  selectedPaths: readonly string[]
): T[] {
  const selected = new Set(selectedPaths);
  return files.filter((file) => selected.has(file.path));
}

export function shouldCreateZip(files: readonly HoldingsManifestFile[]): boolean {
  return files.length > 1;
}

export function buildDownloadFileName(
  date: string,
  type: "csv" | "zip",
  file?: HoldingsManifestFile
): string {
  if (type === "csv" && file) {
    return `${file.etfCode}.csv`;
  }

  return `main-etf-holdings-${date}.zip`;
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
