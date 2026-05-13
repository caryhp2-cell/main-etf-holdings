"use client";

import { useEffect, useMemo, useState } from "react";

import {
  buildDownloadFileName,
  createZipBlob,
  getSelectedDownloadFiles,
  shouldCreateZip,
} from "../download/createDownloadBundle";
import type { HoldingsManifestFile } from "../holdings/loadManifest";

interface DownloadPanelProps {
  files: HoldingsManifestFile[];
  selectedDate: string;
}

export function DownloadPanel({ files, selectedDate }: DownloadPanelProps) {
  const dateFiles = useMemo(
    () => files.filter((file) => file.date === selectedDate),
    [files, selectedDate]
  );
  const allPaths = useMemo(() => dateFiles.map((file) => file.path), [dateFiles]);
  const [selectedPaths, setSelectedPaths] = useState<string[]>(allPaths);
  const selectedFiles = getSelectedDownloadFiles(dateFiles, selectedPaths);
  const allSelected = selectedPaths.length === allPaths.length;

  useEffect(() => {
    setSelectedPaths(allPaths);
  }, [allPaths]);

  function toggleAll(checked: boolean) {
    setSelectedPaths(checked ? allPaths : []);
  }

  function toggleFile(path: string, checked: boolean) {
    setSelectedPaths((current) =>
      checked ? [...new Set([...current, path])] : current.filter((item) => item !== path)
    );
  }

  async function downloadSelectedFiles() {
    if (selectedFiles.length === 0) return;

    if (!shouldCreateZip(selectedFiles)) {
      const [file] = selectedFiles;
      triggerDownload(file.path, buildDownloadFileName(selectedDate, "csv", file));
      return;
    }

    const contents = await Promise.all(
      selectedFiles.map(async (file) => {
        const response = await fetch(file.path);
        if (!response.ok) {
          throw new Error(`Unable to download ${file.path}`);
        }
        return {
          fileName: `${file.etfCode}.csv`,
          content: await response.text(),
        };
      })
    );
    const blob = createZipBlob(contents);
    triggerDownload(URL.createObjectURL(blob), buildDownloadFileName(selectedDate, "zip"), true);
  }

  return (
    <section className="download-panel" aria-labelledby="download-title">
      <div>
        <h2 id="download-title">CSV 下載</h2>
        <p>{selectedDate} 可下載 {dateFiles.length} 個檔案</p>
      </div>
      <div className="download-options">
        <label>
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(event) => toggleAll(event.target.checked)}
          />
          All files
        </label>
        {dateFiles.map((file) => (
          <label key={`${file.date}-${file.etfCode}`}>
            <input
              type="checkbox"
              checked={selectedPaths.includes(file.path)}
              onChange={(event) => toggleFile(file.path, event.target.checked)}
            />
            {file.etfCode}.csv
          </label>
        ))}
      </div>
      <button
        className="download-button"
        type="button"
        disabled={selectedFiles.length === 0}
        onClick={() => void downloadSelectedFiles()}
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
