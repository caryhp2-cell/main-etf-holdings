"use client";

import { useMemo } from "react";

import {
  buildRecentDownloadFileName,
  createZipBlob,
  getRecentDownloadFiles,
} from "../download/createDownloadBundle";
import type { HoldingsManifestFile } from "../holdings/loadManifest";
import { ETF_CODES } from "../holdings/types";

interface DownloadPanelProps {
  files: HoldingsManifestFile[];
}

export function DownloadPanel({ files }: DownloadPanelProps) {
  const downloadFiles = useMemo(() => getRecentDownloadFiles(files, ETF_CODES), [files]);

  async function downloadRecentFiles() {
    if (downloadFiles.length === 0) return;

    const contents = await Promise.all(
      downloadFiles.map(async (file) => {
        const response = await fetch(file.path);
        if (!response.ok) {
          throw new Error(`Unable to download ${file.path}`);
        }
        return {
          fileName: `${file.date}/${file.etfCode}.csv`,
          content: await response.text(),
        };
      })
    );
    const blob = createZipBlob(contents);
    triggerDownload(URL.createObjectURL(blob), buildRecentDownloadFileName(), true);
  }

  return (
    <section className="download-panel" aria-labelledby="download-title">
      <div>
        <h2 id="download-title">CSV 下載</h2>
        <p>下載最近30天資料：00981A、00991A、00992A</p>
      </div>
      <button
        className="download-button"
        type="button"
        disabled={downloadFiles.length === 0}
        onClick={() => void downloadRecentFiles()}
      >
        Download
      </button>
    </section>
  );
}

function triggerDownload(url: string, fileName: string, revoke = false) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();

  if (revoke) {
    URL.revokeObjectURL(url);
  }
}
