import { describe, expect, it } from "vitest";

import { parseGoalStarHoldings } from "./parseGoalStar";
import { ETF_CODES } from "./types";

describe("parseGoalStarHoldings", () => {
  it("parses Goal Star screenshot-style holdings table rows", () => {
    const html = `
      <table>
        <thead>
          <tr>
            <th>代號</th>
            <th>名稱</th>
            <th>股數</th>
            <th>權重</th>
            <th>收盤價</th>
            <th>漲跌</th>
            <th>異動</th>
            <th>狀態</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>2330</td>
            <td>台積電</td>
            <td>1,234,000</td>
            <td>15.67%</td>
            <td>789.50</td>
            <td>+1.23%</td>
            <td>12,000</td>
            <td>加碼</td>
          </tr>
          <tr>
            <td>2317</td>
            <td>鴻海</td>
            <td>987,654</td>
            <td>8.90%</td>
            <td>156.00</td>
            <td>-0.45%</td>
            <td>-5,000</td>
            <td>減碼</td>
          </tr>
        </tbody>
      </table>
    `;

    const fetchedAt = "2026-05-12T13:00:00.000Z";
    const sourceUrl = "https://www.wantgoo.com/etf/00992A/constituent";

    const rows = parseGoalStarHoldings(html, {
      date: "2026-05-12",
      etfCode: "00992A",
      sourceUrl,
      fetchedAt,
    });

    expect(ETF_CODES).toEqual(["00992A", "00991A", "00985A", "00981A"]);
    expect(rows).toEqual([
      {
        date: "2026-05-12",
        etfCode: "00992A",
        symbol: "2330",
        name: "台積電",
        shares: 1234000,
        weight: 15.67,
        closePrice: 789.5,
        changePercent: 1.23,
        shareDelta: 12000,
        status: "加碼",
        sourceUrl,
        fetchedAt,
      },
      {
        date: "2026-05-12",
        etfCode: "00992A",
        symbol: "2317",
        name: "鴻海",
        shares: 987654,
        weight: 8.9,
        closePrice: 156,
        changePercent: -0.45,
        shareDelta: -5000,
        status: "減碼",
        sourceUrl,
        fetchedAt,
      },
    ]);
  });
});
