# Main ETF Holdings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public-ready website that fetches daily Goal Star holdings for `00992A`, `00991A`, `00985A`, and `00981A`, stores CSV snapshots, backfills available May 2026 data, and lets users compare/download holdings by date.

**Architecture:** Use a Vercel-ready Next.js app with static CSV/JSON data checked into the repository. A Node scraper fetches Goal Star fund pages, normalizes holdings into one CSV per ETF per date, and emits a manifest consumed by the web UI. The UI renders four side-by-side ETF analysis columns, each with holdings tables modeled after the provided screenshot.

**Tech Stack:** Next.js, React, TypeScript, Node.js scripts, Playwright or Cheerio for scraping, Vitest for parser/unit tests, GitHub Actions for daily collection, GitHub repo for source hosting, Vercel deployment later after code confirmation.

---

## Confirmed Source Context

- Primary source: Goal Star, `https://goal-star.com/fund/00992A` style fund pages.
- Search results confirm Goal Star has pages for `00992A` and index pages listing `00991A`, `00992A`, `00985A`, and `00981A`.
- The scraper must verify the live page DOM during implementation because Goal Star may render table data client-side.
- Current date is 2026-05-12, so "2026 5月份 historical data" means available trading-day data from 2026-05-01 through 2026-05-12 at implementation time, then later days through the daily job.

## Data Contract

Each saved CSV file uses this filename:

```text
data/holdings/YYYY-MM-DD/ETF_CODE.csv
```

Example:

```text
data/holdings/2026-05-12/00992A.csv
```

Each CSV must have these exact columns:

```csv
date,etfCode,symbol,name,shares,weight,closePrice,changePercent,shareDelta,status,sourceUrl,fetchedAt
```

`status` must be one of:

```text
新增,加碼,減碼,不變,未知
```

`data/manifest.json` shape:

```json
{
  "generatedAt": "2026-05-12T12:00:00.000Z",
  "etfs": ["00992A", "00991A", "00985A", "00981A"],
  "dates": ["2026-05-01", "2026-05-04", "2026-05-05"],
  "files": [
    {
      "date": "2026-05-12",
      "etfCode": "00992A",
      "path": "/data/holdings/2026-05-12/00992A.csv",
      "rowCount": 50
    }
  ]
}
```

---

### Task 1: Scaffold Next.js Project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`
- Create: `.gitignore`

- [ ] **Step 1: Create the project files**

Create a Next.js TypeScript app in the repo root with scripts:

```json
{
  "name": "main-etf-holdings",
  "private": true,
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "lint": "next lint",
    "test": "vitest run",
    "scrape:today": "tsx scripts/scrape-goalstar.ts --today",
    "scrape:range": "tsx scripts/scrape-goalstar.ts",
    "manifest": "tsx scripts/build-manifest.ts"
  },
  "dependencies": {
    "@vitejs/plugin-react": "latest",
    "cheerio": "latest",
    "next": "latest",
    "papaparse": "latest",
    "react": "latest",
    "react-dom": "latest"
  },
  "devDependencies": {
    "@types/node": "latest",
    "@types/papaparse": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "tsx": "latest",
    "typescript": "latest",
    "vitest": "latest"
  }
}
```

- [ ] **Step 2: Run install**

Run:

```powershell
npm install
```

Expected: `package-lock.json` is created and dependency installation succeeds.

- [ ] **Step 3: Build smoke test**

Run:

```powershell
npm run build
```

Expected: build succeeds with a minimal placeholder page.

- [ ] **Step 4: Commit**

```powershell
git add .
git commit -m "chore: scaffold ETF holdings website"
```

---

### Task 2: Add Holdings Parser and Tests

**Files:**
- Create: `src/holdings/types.ts`
- Create: `src/holdings/parseGoalStar.ts`
- Create: `src/holdings/parseGoalStar.test.ts`

- [ ] **Step 1: Define types**

```ts
export const ETF_CODES = ["00992A", "00991A", "00985A", "00981A"] as const;
export type EtfCode = (typeof ETF_CODES)[number];

export type HoldingStatus = "新增" | "加碼" | "減碼" | "不變" | "未知";

export type HoldingRow = {
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
};
```

- [ ] **Step 2: Write parser test using screenshot-style table HTML**

```ts
import { describe, expect, it } from "vitest";
import { parseGoalStarHoldings } from "./parseGoalStar";

const html = `
<table>
  <thead><tr><th>代號</th><th>名稱</th><th>股數</th><th>權重</th><th>收盤價</th><th>漲跌</th><th>異動</th><th>狀態</th></tr></thead>
  <tbody>
    <tr><td>2330</td><td>台積電</td><td>11,657,000</td><td>9.63%</td><td>2,255</td><td>0.895</td><td>298,000</td><td>加碼</td></tr>
    <tr><td>2317</td><td>鴻海</td><td>3,612,000</td><td>0.33%</td><td>250</td><td>-0.794</td><td>-10,565,000</td><td>減碼</td></tr>
  </tbody>
</table>`;

describe("parseGoalStarHoldings", () => {
  it("normalizes Goal Star holdings rows", () => {
    const rows = parseGoalStarHoldings({
      html,
      date: "2026-05-12",
      etfCode: "00992A",
      sourceUrl: "https://goal-star.com/fund/00992A",
      fetchedAt: "2026-05-12T12:00:00.000Z"
    });

    expect(rows).toEqual([
      {
        date: "2026-05-12",
        etfCode: "00992A",
        symbol: "2330",
        name: "台積電",
        shares: 11657000,
        weight: 9.63,
        closePrice: 2255,
        changePercent: 0.895,
        shareDelta: 298000,
        status: "加碼",
        sourceUrl: "https://goal-star.com/fund/00992A",
        fetchedAt: "2026-05-12T12:00:00.000Z"
      },
      {
        date: "2026-05-12",
        etfCode: "00992A",
        symbol: "2317",
        name: "鴻海",
        shares: 3612000,
        weight: 0.33,
        closePrice: 250,
        changePercent: -0.794,
        shareDelta: -10565000,
        status: "減碼",
        sourceUrl: "https://goal-star.com/fund/00992A",
        fetchedAt: "2026-05-12T12:00:00.000Z"
      }
    ]);
  });
});
```

- [ ] **Step 3: Run failing test**

Run:

```powershell
npm test -- src/holdings/parseGoalStar.test.ts
```

Expected: FAIL because `parseGoalStarHoldings` does not exist yet.

- [ ] **Step 4: Implement parser**

Implement with Cheerio:

```ts
import * as cheerio from "cheerio";
import type { EtfCode, HoldingRow, HoldingStatus } from "./types";

type ParseInput = {
  html: string;
  date: string;
  etfCode: EtfCode;
  sourceUrl: string;
  fetchedAt: string;
};

const toNumber = (value: string): number | null => {
  const cleaned = value.replace(/,/g, "").replace(/%/g, "").trim();
  if (!cleaned || cleaned === "-") return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const toStatus = (value: string): HoldingStatus => {
  if (value.includes("新增")) return "新增";
  if (value.includes("加碼")) return "加碼";
  if (value.includes("減碼")) return "減碼";
  if (value.includes("不變")) return "不變";
  return "未知";
};

export function parseGoalStarHoldings(input: ParseInput): HoldingRow[] {
  const $ = cheerio.load(input.html);
  const rows: HoldingRow[] = [];

  $("table tbody tr").each((_, row) => {
    const cells = $(row).find("td").map((__, cell) => $(cell).text().trim()).get();
    if (cells.length < 8) return;

    rows.push({
      date: input.date,
      etfCode: input.etfCode,
      symbol: cells[0],
      name: cells[1],
      shares: toNumber(cells[2]) ?? 0,
      weight: toNumber(cells[3]) ?? 0,
      closePrice: toNumber(cells[4]),
      changePercent: toNumber(cells[5]),
      shareDelta: toNumber(cells[6]),
      status: toStatus(cells[7]),
      sourceUrl: input.sourceUrl,
      fetchedAt: input.fetchedAt
    });
  });

  return rows.filter((row) => row.symbol && row.name);
}
```

- [ ] **Step 5: Run passing test**

Run:

```powershell
npm test -- src/holdings/parseGoalStar.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/holdings
git commit -m "test: add Goal Star holdings parser"
```

---

### Task 3: Add Scraper and CSV Writer

**Files:**
- Create: `scripts/scrape-goalstar.ts`
- Create: `src/holdings/writeCsv.ts`
- Create: `src/holdings/writeCsv.test.ts`

- [ ] **Step 1: Write CSV test**

Test that rows serialize using the exact data contract headers.

- [ ] **Step 2: Implement CSV writer**

Use `papaparse` to write UTF-8 CSV files with headers:

```ts
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import Papa from "papaparse";
import type { HoldingRow } from "./types";

export async function writeHoldingsCsv(filePath: string, rows: HoldingRow[]) {
  await mkdir(dirname(filePath), { recursive: true });
  const csv = Papa.unparse(rows, {
    columns: [
      "date",
      "etfCode",
      "symbol",
      "name",
      "shares",
      "weight",
      "closePrice",
      "changePercent",
      "shareDelta",
      "status",
      "sourceUrl",
      "fetchedAt"
    ]
  });
  await writeFile(filePath, `${csv}\n`, "utf8");
}
```

- [ ] **Step 3: Implement daily scraper CLI**

The CLI must support:

```powershell
npm run scrape:today
npm run scrape:range -- --from 2026-05-01 --to 2026-05-12
```

Behavior:
- Fetch `https://goal-star.com/fund/{ETF_CODE}` for each ETF.
- Parse rows.
- Save each ETF snapshot to `data/holdings/{date}/{ETF_CODE}.csv`.
- If the page contains no table rows, fail loudly with `No holdings rows parsed for {ETF_CODE}`.

- [ ] **Step 4: Run scraper for today**

Run:

```powershell
npm run scrape:today
```

Expected: four CSV files are created under today's date.

- [ ] **Step 5: Commit**

```powershell
git add scripts src/holdings data/holdings
git commit -m "feat: scrape Goal Star ETF holdings to CSV"
```

---

### Task 4: Backfill Available May 2026 Data

**Files:**
- Modify: `scripts/scrape-goalstar.ts`
- Create data files under: `data/holdings/2026-05-*/*.csv`

- [ ] **Step 1: Verify whether Goal Star exposes historical dates**

Inspect the live page and network calls for date parameters or embedded historical data. Test likely URLs or query params only after reading the rendered page/network payload:

```powershell
npm run scrape:range -- --from 2026-05-01 --to 2026-05-12
```

Expected if historical access exists: CSV files for all available May 2026 trading days.

Expected if historical access does not exist: document that Goal Star exposes only the current snapshot, then seed May 2026 with available current snapshots and begin accumulating future daily snapshots.

- [ ] **Step 2: Add backfill report**

Create:

```text
data/backfill-report-2026-05.md
```

Include:
- Dates attempted.
- Dates successfully fetched.
- ETFs successfully fetched per date.
- Any dates unavailable from Goal Star.
- Exact source URLs used.

- [ ] **Step 3: Commit**

```powershell
git add data scripts
git commit -m "data: backfill May 2026 ETF holdings"
```

---

### Task 5: Build Manifest

**Files:**
- Create: `scripts/build-manifest.ts`
- Create: `data/manifest.json`
- Create: `src/holdings/loadManifest.ts`

- [ ] **Step 1: Implement manifest builder**

Read `data/holdings/**/{ETF_CODE}.csv`, count rows, sort dates ascending, and write `data/manifest.json`.

- [ ] **Step 2: Run manifest build**

Run:

```powershell
npm run manifest
```

Expected: `data/manifest.json` lists all CSV files and available dates.

- [ ] **Step 3: Commit**

```powershell
git add data/manifest.json scripts/build-manifest.ts src/holdings/loadManifest.ts
git commit -m "feat: add holdings data manifest"
```

---

### Task 6: Build Four-Column Analysis Website

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/globals.css`
- Create: `src/components/DateSelector.tsx`
- Create: `src/components/EtfHoldingsColumn.tsx`
- Create: `src/components/DownloadPanel.tsx`
- Create: `src/holdings/loadCsv.ts`

- [ ] **Step 1: Create layout**

The page must show:
- Header: `Main ETF Holdings`
- Date selector populated from `data/manifest.json`
- Download panel with checkboxes for each CSV and an `All files` option
- Four columns in this order: `00992A`, `00991A`, `00985A`, `00981A`
- Each column has a compact summary and holdings table.

- [ ] **Step 2: Match analysis table style**

Each ETF column table must use these columns:

```text
代號, 名稱, 股數, 權重, 收盤價, 漲跌, 異動, 狀態
```

Visual rules:
- Clean white background.
- Blue-gray table text.
- Green positive/add/new values.
- Red negative price/change values where appropriate.
- Orange for reduction status.
- Small rounded status pills similar to the screenshot.
- Sticky table header inside each ETF column.

- [ ] **Step 3: Add date comparison behavior**

When the user selects a date, all four ETF columns update together. If an ETF CSV does not exist for that date, show:

```text
該日期尚無資料
```

- [ ] **Step 4: Run UI locally**

Run:

```powershell
npm run dev
```

Expected: local site opens at `http://localhost:3000` and renders four ETF columns.

- [ ] **Step 5: Commit**

```powershell
git add app src/components src/holdings
git commit -m "feat: build ETF holdings analysis page"
```

---

### Task 7: Add Multi-File Download

**Files:**
- Modify: `src/components/DownloadPanel.tsx`
- Create: `src/download/createDownloadBundle.ts`
- Create: `src/download/createDownloadBundle.test.ts`

- [ ] **Step 1: Add download behavior**

Implement browser-side downloads:
- One selected file: direct download of the CSV.
- Multiple selected files or `All files`: download a generated `.zip`.

Use a small ZIP library such as `fflate`.

- [ ] **Step 2: Add tests for selected files**

Test that the selected file list maps to the expected manifest paths and generated archive name:

```text
main-etf-holdings-YYYY-MM-DD.zip
```

- [ ] **Step 3: Run tests**

```powershell
npm test
```

Expected: download tests pass.

- [ ] **Step 4: Commit**

```powershell
git add src/download src/components/DownloadPanel.tsx package.json package-lock.json
git commit -m "feat: add CSV download selection"
```

---

### Task 8: Add Daily Automation Through GitHub Actions

**Files:**
- Create: `.github/workflows/daily-holdings.yml`

- [ ] **Step 1: Add workflow**

Schedule daily Taiwan-time collection. GitHub Actions cron uses UTC, so use `30 10 * * 1-5` for 18:30 Asia/Taipei on weekdays.

Workflow behavior:
- Install dependencies.
- Run `npm run scrape:today`.
- Run `npm run manifest`.
- Commit changed CSV/manifest files back to the repo.

- [ ] **Step 2: Verify workflow syntax locally**

Run:

```powershell
npm run build
```

Expected: build still succeeds with data present.

- [ ] **Step 3: Commit**

```powershell
git add .github/workflows/daily-holdings.yml
git commit -m "ci: collect ETF holdings daily"
```

---

### Task 9: Verify and Prepare GitHub Repo

**Files:**
- Modify only if needed: `README.md`

- [ ] **Step 1: Add README**

Document:
- Project purpose.
- ETF codes tracked.
- Data source: Goal Star.
- CSV schema.
- Local commands.
- Vercel deployment is intentionally deferred until final code approval.

- [ ] **Step 2: Run full verification**

Run:

```powershell
npm test
npm run build
```

Expected: all tests pass and production build succeeds.

- [ ] **Step 3: Create GitHub repository**

Create a new GitHub repo named:

```text
Main-ETF-Holdings
```

Then push the current branch:

```powershell
git remote add origin https://github.com/<OWNER>/Main-ETF-Holdings.git
git push -u origin HEAD
```

- [ ] **Step 4: Stop before Vercel**

Do not deploy to Vercel yet. Final status should say the repo is ready for Vercel deployment after code confirmation.

---

## Acceptance Criteria

- Four ETF codes are supported: `00992A`, `00991A`, `00985A`, `00981A`.
- Daily scraper saves one CSV per ETF per date.
- Available May 2026 historical data is attempted and documented in `data/backfill-report-2026-05.md`.
- Website lets user select a date and updates all four ETF columns together.
- Website displays holdings table columns matching the provided template.
- User can select one, multiple, or all CSV files and download them.
- GitHub repo `Main-ETF-Holdings` is created and pushed.
- Vercel deployment is not performed until the user confirms.

## Self-Review

- Spec coverage: every requirement maps to Tasks 3, 4, 6, 7, 8, and 9.
- Placeholder scan: no `TBD` or `TODO` placeholders remain.
- Type consistency: `EtfCode`, `HoldingRow`, CSV headers, and manifest fields are consistent across parser, scraper, manifest, UI, and downloads.
- Scope check: this is one coherent project with separable data, UI, automation, and publishing tasks.
