import type { HoldingsManifestFile } from "../holdings/loadManifest";

interface DownloadPanelProps {
  files: HoldingsManifestFile[];
  selectedDate: string;
}

export function DownloadPanel({ files, selectedDate }: DownloadPanelProps) {
  const dateFiles = files.filter((file) => file.date === selectedDate);

  return (
    <section className="download-panel" aria-labelledby="download-title">
      <div>
        <h2 id="download-title">CSV 下載</h2>
        <p>{selectedDate} 可下載 {dateFiles.length} 個檔案</p>
      </div>
      <div className="download-options">
        <label>
          <input type="checkbox" defaultChecked />
          All files
        </label>
        {dateFiles.map((file) => (
          <label key={`${file.date}-${file.etfCode}`}>
            <input type="checkbox" defaultChecked />
            {file.etfCode}.csv
          </label>
        ))}
      </div>
      <button className="download-button" type="button" disabled>
        Download
      </button>
    </section>
  );
}
