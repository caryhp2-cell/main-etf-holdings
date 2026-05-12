# May 2026 Goal Star Backfill Report

## Scope

- Dates attempted: 2026-05-01 through 2026-05-12.
- ETF codes attempted: 00992A, 00991A, 00985A, 00981A.
- Public Goal Star source URL pattern: `https://goal-star.com/fund/{ETF_CODE}`.
- Goal Star shares API URL pattern used by the scraper: `https://goal-star.com/api/funds/{ETF_CODE}/shares?date={YYYY-MM-DD}`.
- Backfill command first attempted: `npm run scrape:range -- --from 2026-05-01 --to 2026-05-12`.
- Because the full-range command stops on the first unavailable date, each date was then probed individually with `npm run scrape:range -- --from {YYYY-MM-DD} --to {YYYY-MM-DD}`.

## Result

Goal Star exposes dated holdings through the shares API for available trading days. The scraper only wrote CSV files when the API item `date` matched the requested date, so unavailable dates failed clearly instead of saving stale latest data.

## Dates Successfully Fetched

| Date | 00992A | 00991A | 00985A | 00981A |
| --- | ---: | ---: | ---: | ---: |
| 2026-05-05 | 48 rows | 50 rows | 50 rows | 51 rows |
| 2026-05-06 | 48 rows | 50 rows | 50 rows | 51 rows |
| 2026-05-07 | 47 rows | 50 rows | 50 rows | 50 rows |
| 2026-05-08 | 46 rows | 50 rows | 50 rows | 50 rows |
| 2026-05-11 | 46 rows | 51 rows | 50 rows | 51 rows |
| 2026-05-12 | 45 rows | 50 rows | 50 rows | 51 rows |

## Dates Unavailable From Goal Star

| Date | Result |
| --- | --- |
| 2026-05-01 | All four ETF API requests returned `402 Payment Required`. |
| 2026-05-02 | All four ETF API requests returned `402 Payment Required`. |
| 2026-05-03 | All four ETF API requests returned `402 Payment Required`. |
| 2026-05-04 | All four ETF API requests returned `402 Payment Required`. |
| 2026-05-09 | All four ETF API requests returned HTTP 200 with `items: []`; scraper failed with `Goal Star API payload contained zero items.` |
| 2026-05-10 | All four ETF API requests returned HTTP 200 with `items: []`; scraper failed with `Goal Star API payload contained zero items.` |

## Exact API URLs Used

### 2026-05-01

- `https://goal-star.com/api/funds/00992A/shares?date=2026-05-01`
- `https://goal-star.com/api/funds/00991A/shares?date=2026-05-01`
- `https://goal-star.com/api/funds/00985A/shares?date=2026-05-01`
- `https://goal-star.com/api/funds/00981A/shares?date=2026-05-01`

### 2026-05-02

- `https://goal-star.com/api/funds/00992A/shares?date=2026-05-02`
- `https://goal-star.com/api/funds/00991A/shares?date=2026-05-02`
- `https://goal-star.com/api/funds/00985A/shares?date=2026-05-02`
- `https://goal-star.com/api/funds/00981A/shares?date=2026-05-02`

### 2026-05-03

- `https://goal-star.com/api/funds/00992A/shares?date=2026-05-03`
- `https://goal-star.com/api/funds/00991A/shares?date=2026-05-03`
- `https://goal-star.com/api/funds/00985A/shares?date=2026-05-03`
- `https://goal-star.com/api/funds/00981A/shares?date=2026-05-03`

### 2026-05-04

- `https://goal-star.com/api/funds/00992A/shares?date=2026-05-04`
- `https://goal-star.com/api/funds/00991A/shares?date=2026-05-04`
- `https://goal-star.com/api/funds/00985A/shares?date=2026-05-04`
- `https://goal-star.com/api/funds/00981A/shares?date=2026-05-04`

### 2026-05-05

- `https://goal-star.com/api/funds/00992A/shares?date=2026-05-05`
- `https://goal-star.com/api/funds/00991A/shares?date=2026-05-05`
- `https://goal-star.com/api/funds/00985A/shares?date=2026-05-05`
- `https://goal-star.com/api/funds/00981A/shares?date=2026-05-05`

### 2026-05-06

- `https://goal-star.com/api/funds/00992A/shares?date=2026-05-06`
- `https://goal-star.com/api/funds/00991A/shares?date=2026-05-06`
- `https://goal-star.com/api/funds/00985A/shares?date=2026-05-06`
- `https://goal-star.com/api/funds/00981A/shares?date=2026-05-06`

### 2026-05-07

- `https://goal-star.com/api/funds/00992A/shares?date=2026-05-07`
- `https://goal-star.com/api/funds/00991A/shares?date=2026-05-07`
- `https://goal-star.com/api/funds/00985A/shares?date=2026-05-07`
- `https://goal-star.com/api/funds/00981A/shares?date=2026-05-07`

### 2026-05-08

- `https://goal-star.com/api/funds/00992A/shares?date=2026-05-08`
- `https://goal-star.com/api/funds/00991A/shares?date=2026-05-08`
- `https://goal-star.com/api/funds/00985A/shares?date=2026-05-08`
- `https://goal-star.com/api/funds/00981A/shares?date=2026-05-08`

### 2026-05-09

- `https://goal-star.com/api/funds/00992A/shares?date=2026-05-09`
- `https://goal-star.com/api/funds/00991A/shares?date=2026-05-09`
- `https://goal-star.com/api/funds/00985A/shares?date=2026-05-09`
- `https://goal-star.com/api/funds/00981A/shares?date=2026-05-09`

### 2026-05-10

- `https://goal-star.com/api/funds/00992A/shares?date=2026-05-10`
- `https://goal-star.com/api/funds/00991A/shares?date=2026-05-10`
- `https://goal-star.com/api/funds/00985A/shares?date=2026-05-10`
- `https://goal-star.com/api/funds/00981A/shares?date=2026-05-10`

### 2026-05-11

- `https://goal-star.com/api/funds/00992A/shares?date=2026-05-11`
- `https://goal-star.com/api/funds/00991A/shares?date=2026-05-11`
- `https://goal-star.com/api/funds/00985A/shares?date=2026-05-11`
- `https://goal-star.com/api/funds/00981A/shares?date=2026-05-11`

### 2026-05-12

- `https://goal-star.com/api/funds/00992A/shares?date=2026-05-12`
- `https://goal-star.com/api/funds/00991A/shares?date=2026-05-12`
- `https://goal-star.com/api/funds/00985A/shares?date=2026-05-12`
- `https://goal-star.com/api/funds/00981A/shares?date=2026-05-12`
