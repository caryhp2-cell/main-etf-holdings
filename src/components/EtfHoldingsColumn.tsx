import type { EtfCode, HoldingRow, HoldingStatus } from "../holdings/types";
import type { HoldingsSort, SortKey } from "../holdings/sortHoldings";
import { formatShareDeltaLots } from "../holdings/formatHoldingValues";

interface EtfHoldingsColumnProps {
  etfCode: EtfCode;
  rows: HoldingRow[];
  sort: HoldingsSort;
  onSort: (key: SortKey) => void;
}

const STATUS_CLASS: Record<HoldingStatus, string> = {
  新增: "status-new",
  加碼: "status-increase",
  減碼: "status-decrease",
  不變: "status-unchanged",
  未知: "status-unknown",
};

export function EtfHoldingsColumn({ etfCode, rows, sort, onSort }: EtfHoldingsColumnProps) {
  const totalWeight = rows.reduce((sum, row) => sum + row.weight, 0);
  const additions = rows.filter((row) => row.status === "新增" || row.status === "加碼").length;
  const reductions = rows.filter((row) => row.status === "減碼").length;
  const isFeatured = etfCode === "00981A";

  return (
    <section
      className={`etf-column${isFeatured ? " etf-column-featured" : ""}`}
      aria-labelledby={`etf-${etfCode}`}
    >
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
                <SortableHeader label="權重" sortKey="weight" activeSort={sort} onSort={onSort} />
                <th>收盤價</th>
                <SortableHeader
                  label="漲跌"
                  sortKey="changePercent"
                  activeSort={sort}
                  onSort={onSort}
                />
                <th className="numeric">異動張數</th>
                <SortableHeader label="狀態" sortKey="status" activeSort={sort} onSort={onSort} />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.etfCode}-${row.symbol}`}>
                  <td className="symbol">{row.symbol}</td>
                  <td>{row.name}</td>
                  <td className="numeric">{row.weight.toFixed(2)}%</td>
                  <td className={priceClass(row.closePrice)}>{formatNumber(row.closePrice)}</td>
                  <td className={changeClass(row.changePercent)}>
                    {formatNumber(row.changePercent)}
                  </td>
                  <td className={deltaClass(row.shareDelta)}>
                    {formatShareDeltaLots(row.shareDelta)}
                  </td>
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

function SortableHeader({
  label,
  sortKey,
  activeSort,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  activeSort: HoldingsSort;
  onSort: (key: SortKey) => void;
}) {
  const isActive = activeSort.key === sortKey;
  const arrow = isActive ? (activeSort.direction === "desc" ? "↓" : "↑") : "↕";

  return (
    <th>
      <button className="sort-button" type="button" onClick={() => onSort(sortKey)}>
        <span>{label}</span>
        <span aria-hidden="true">{arrow}</span>
      </button>
    </th>
  );
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
