# Main ETF Holdings

Main ETF Holdings is a Next.js dashboard for tracking and comparing daily Goal Star holdings for three Taiwan active ETFs:

- `00981A`
- `00992A`
- `00991A`

The app stores Goal Star holdings as checked-in CSV snapshots, builds a manifest index for the website, and presents the holdings in a modern three-card dashboard. `00981A` is placed in the center because it is the largest ETF, while all three tables keep a similar size for comparison.

## Features

- Daily holdings scraper for Goal Star ETF holdings APIs.
- Historical CSV snapshots under `data/holdings/YYYY-MM-DD/ETF_CODE.csv`.
- Date selector for comparing holdings across available trading days.
- Three synchronized holdings tables with shared sorting.
- Dashboard-style glass cards with `00981A` visually emphasized in the center.
- Download button for the latest 30 available days of CSV data.
- GitHub Actions workflow for weekday data refreshes.

## Dashboard Details

The table columns are:

- Code
- Name
- Weight
- Close price
- Change percentage
- Share delta in Taiwan trading lots
- Status

Notes on units:

- `changePercent` is shown as percentage points and rounded to 2 decimal places.
- Goal Star share deltas are stored as shares in CSV, then displayed as lots in the UI by dividing by `1000`.
- CSV keeps raw `shares` and `shareDelta` values to preserve source data fidelity.

## Data Source

Holdings are collected from Goal Star:

- Public fund page: `https://goal-star.com/fund/{ETF_CODE}`
- Holdings API: `https://goal-star.com/api/funds/{ETF_CODE}/shares?date={YYYY-MM-DD}`

The scraper validates row dates before writing CSV files.

## CSV Schema

Each file is saved under:

```text
data/holdings/YYYY-MM-DD/ETF_CODE.csv
```

Columns:

```text
date,etfCode,symbol,name,shares,weight,closePrice,changePercent,shareDelta,status,sourceUrl,fetchedAt
```

## Manifest

`data/manifest.json` is the website's data index. It lists:

- supported ETF codes
- available dates
- CSV file paths
- row counts

Run this after adding or updating CSV files:

```powershell
npm run manifest
```

## Commands

```powershell
npm install
npm run dev
npm run scrape:today
npm run scrape:range -- --from 2026-05-01 --to 2026-05-12
npm run manifest
npm test
npm run lint
npm run build
```

## Automation

`.github/workflows/daily-holdings.yml` runs on weekdays at 18:30 Asia/Taipei. It scrapes the latest holdings, rebuilds `data/manifest.json`, and commits changed data files.

## Deployment

The app is ready for Vercel deployment after the repository is published to GitHub.

Recommended flow:

1. Create a GitHub repository named `main-etf-holdings`.
2. Push this local repository to GitHub.
3. Import the GitHub repository into Vercel.
4. Use the default Next.js build settings:
   - Install command: `npm install`
   - Build command: `npm run build`
   - Output: Vercel auto-detects Next.js
5. Confirm the production site can read `/data/manifest.json` and CSV files under `/data/holdings`.

## Current Publish Checklist

- Code is committed locally.
- Tests pass.
- Lint passes.
- Production build passes.
- GitHub remote still needs to be connected before pushing.
- Vercel deployment can proceed after GitHub publication or after Vercel CLI/account connection is available.
