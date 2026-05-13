import { DateSelector } from "../src/components/DateSelector";
import { DownloadPanel } from "../src/components/DownloadPanel";
import { EtfHoldingsColumn } from "../src/components/EtfHoldingsColumn";
import { loadHoldingsCsv } from "../src/holdings/loadCsv";
import { loadManifest } from "../src/holdings/loadManifest";
import { ETF_CODES, type EtfCode } from "../src/holdings/types";

interface HomeProps {
  searchParams: Promise<{
    date?: string;
  }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const manifest = loadManifest();
  const params = await searchParams;
  const selectedDate = manifest.dates.includes(params.date ?? "")
    ? params.date
    : manifest.dates.at(-1) ?? "";
  const holdingsByEtf = await loadHoldingsByEtf(selectedDate ?? "");

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Goal Star daily holdings</p>
          <h1>Main ETF Holdings</h1>
        </div>
        <DateSelector dates={manifest.dates} selectedDate={selectedDate ?? ""} />
      </header>

      <DownloadPanel files={manifest.files} selectedDate={selectedDate ?? ""} />

      <section className="holdings-grid" aria-label="ETF holdings comparison">
        {ETF_CODES.map((etfCode) => (
          <EtfHoldingsColumn
            key={etfCode}
            etfCode={etfCode}
            rows={holdingsByEtf[etfCode]}
          />
        ))}
      </section>
    </main>
  );
}

async function loadHoldingsByEtf(date: string): Promise<Record<EtfCode, Awaited<ReturnType<typeof loadHoldingsCsv>>>> {
  const entries = await Promise.all(
    ETF_CODES.map(async (etfCode) => [
      etfCode,
      await loadHoldingsCsv({ date, etfCode }),
    ] as const)
  );

  return Object.fromEntries(entries) as Record<EtfCode, Awaited<ReturnType<typeof loadHoldingsCsv>>>;
}
