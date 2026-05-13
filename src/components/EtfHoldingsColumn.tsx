import type { EtfCode, HoldingRow, HoldingStatus } from "../holdings/types";

interface EtfHoldingsColumnProps {
  etfCode: EtfCode;
  rows: HoldingRow[];
}

const STATUS_CLASS: Record<HoldingStatus, string> = {
  新增: "status-new",
  加碼: "status-increase",
  減碼: "status-decrease",
  不變: "status-unchanged",
  未知: "status-unknown",
};

export function EtfHoldingsColumn({ etfCode, rows }: EtfHoldingsColumnProps) {
  const totalWeight = rows.reduce((sum, row) => sum + row.weight, 0);
  const additions = rows.filter((row) => row.status === "新增" || row.status === "加碼").length;
  const reductions = rows.filter((row) => row.status === "減碼").length;

  return (
    <section className="etf-column" aria-labelledby={`etf-${etfCode}`}>
      <div className="column-summary">
        <div>
          <h2 id={`etf-${etfCode}`}>{etfCode}</h2>
          <p>{rows.length ? `${rows.length} 檔持股` : "該日期尚無資料"}</p>
        </div>
        {rows.length > 0 ? (
          <dl>
            <div>
              <dt>權重</dt>
              <dd>{totalWeight.toFixed(2)}%</dd>
            </div>
            <div>
              <dt>加碼</dt>
              <dd>{additions}</dd>
            </div>
            <div>
              <dt>減碼</dt>
              <dd>{reductions}</dd>
            </div>
          </dl>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <div className="empty-state">該日期尚無資料</div>
      ) : (
        <div className="table-wrap">
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
              {rows.map((row) => (
                <tr key={`${row.etfCode}-${row.symbol}`}>
                  <td className="symbol">{row.symbol}</td>
                  <td>{row.name}</td>
                  <td className="numeric">{formatInteger(row.shares)}</td>
                  <td className="numeric">{row.weight.toFixed(2)}%</td>
                  <td className={priceClass(row.closePrice)}>{formatNumber(row.closePrice)}</td>
                  <td className={changeClass(row.changePercent)}>
                    {formatNumber(row.changePercent)}
                  </td>
                  <td className={deltaClass(row.shareDelta)}>{formatInteger(row.shareDelta)}</td>
                  <td>
                    <span className={`status-pill ${STATUS_CLASS[row.status]}`}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function formatInteger(value: number | null): string {
  return value == null ? "-" : new Intl.NumberFormat("en-US").format(value);
}

function formatNumber(value: number | null): string {
  return value == null ? "-" : new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 }).format(value);
}

function priceClass(value: number | null): string {
  return value != null && value > 0 ? "numeric price-positive" : "numeric";
}

function changeClass(value: number | null): string {
  if (value == null || value === 0) return "numeric";
  return value > 0 ? "numeric value-red" : "numeric value-green";
}

function deltaClass(value: number | null): string {
  if (value == null || value === 0) return "numeric value-blue";
  return value > 0 ? "numeric value-blue" : "numeric value-orange";
}
