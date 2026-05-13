# Main ETF Holdings

Main ETF Holdings is a Next.js dashboard for comparing daily Goal Star holdings across four Taiwan active ETFs:

- `00992A`
- `00991A`
- `00985A`
- `00981A`

The site reads checked-in CSV snapshots, lets users switch dates, shows four ETF holdings tables side by side, and supports single or multi-file CSV downloads.

## Data Source

Holdings are collected from Goal Star:

- Public fund page: `https://goal-star.com/fund/{ETF_CODE}`
- Holdings API used by the scraper: `https://goal-star.com/api/funds/{ETF_CODE}/shares?date={YYYY-MM-DD}`

The scraper validates that Goal Star API row dates match the requested date before writing CSV files.

## CSV Schema

Each file is saved under:

```text
data/holdings/YYYY-MM-DD/ETF_CODE.csv
```

Columns:

```text
date,etfCode,symbol,name,shares,weight,closePrice,changePercent,shareDelta,status,sourceUrl,fetchedAt
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

`.github/workflows/daily-holdings.yml` runs on weekdays at 18:30 Asia/Taipei, scrapes the latest holdings, rebuilds `data/manifest.json`, and commits changed data files.

## Deployment

The project is ready for Vercel deployment, but deployment is intentionally deferred until final code confirmation.
