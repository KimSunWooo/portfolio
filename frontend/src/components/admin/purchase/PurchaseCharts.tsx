"use client";

import type { PurchaseNamedMetric } from "@/lib/api";

function metricValue(item: PurchaseNamedMetric, metric: string): number {
  if (metric === "QUANTITY") return item.quantity;
  if (metric === "ORDER_COUNT") return item.orderCount;
  return item.salesAmount;
}

function metricUnit(metric: string): string {
  if (metric === "QUANTITY") return "개";
  if (metric === "ORDER_COUNT") return "건";
  return "원";
}

function formatValue(value: number, metric: string): string {
  if (metric === "SALES_AMOUNT") {
    return `₩${value.toLocaleString("ko-KR")}`;
  }
  return `${value.toLocaleString("ko-KR")}${metricUnit(metric)}`;
}

export function BarChart({
  title,
  items,
  metric,
  horizontal = false,
}: {
  title: string;
  items: PurchaseNamedMetric[];
  metric: string;
  horizontal?: boolean;
}) {
  const max = Math.max(1, ...items.map((item) => metricValue(item, metric)));
  return (
    <section className="min-w-0 border border-black/10 bg-white p-4 md:p-5" aria-label={title}>
      <h3 className="text-[11px] tracking-[0.14em] text-[#555]">{title}</h3>
      <p className="mt-1 text-[10px] text-[#888]">단위: {metricUnit(metric)}</p>
      {items.length === 0 ? (
        <p className="mt-6 text-sm text-[#777]">표시할 값이 없습니다.</p>
      ) : horizontal ? (
        <ul className="mt-4 space-y-3">
          {items.map((item) => {
            const value = metricValue(item, metric);
            const width = value <= 0 ? "0%" : `${Math.max(2, (value / max) * 100)}%`;
            return (
              <li key={item.name}>
                <div className="flex items-baseline justify-between gap-3 text-[11px]">
                  <span className="truncate">{item.name}</span>
                  <span className="shrink-0 tabular-nums text-[#555]">{formatValue(value, metric)}</span>
                </div>
                <div className="mt-1 h-2 bg-[#eceae4]" aria-hidden="true">
                  <div className="h-full bg-[#111]" style={{ width }} />
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-4 flex h-40 items-end gap-1 overflow-x-auto md:gap-2">
          {items.map((item) => {
            const value = metricValue(item, metric);
            const height = value <= 0 ? "0%" : `${Math.max(4, (value / max) * 100)}%`;
            return (
              <div key={item.name} className="flex min-w-[28px] flex-1 flex-col items-center justify-end">
                <span className="mb-1 text-[9px] tabular-nums text-[#666]">{formatValue(value, metric)}</span>
                <div className="flex h-28 w-full items-end bg-[#eceae4]" aria-hidden="true">
                  <div className="w-full bg-[#111]" style={{ height }} title={`${item.name}: ${formatValue(value, metric)}`} />
                </div>
                <span className="mt-2 max-w-full truncate text-[9px] text-[#666]">{item.name}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function MetricTable({
  title,
  rows,
}: {
  title: string;
  rows: PurchaseNamedMetric[];
}) {
  return (
    <section className="min-w-0 overflow-x-auto border border-black/10 bg-white p-4 md:p-5" aria-label={title}>
      <h3 className="text-[11px] tracking-[0.14em] text-[#555]">{title}</h3>
      <table className="mt-4 w-full min-w-[480px] border-collapse text-left text-[12px]">
        <thead>
          <tr className="border-b border-black/15 text-[10px] tracking-[0.12em] text-[#777]">
            <th scope="col" className="py-2 font-normal">항목</th>
            <th scope="col" className="py-2 font-normal">주문 수</th>
            <th scope="col" className="py-2 font-normal">판매 수량</th>
            <th scope="col" className="py-2 font-normal">상품 판매금액</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-6 text-[#777]">표시할 값이 없습니다.</td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.name} className="border-b border-black/10">
                <th scope="row" className="py-2 font-normal text-[#222]">{row.name}</th>
                <td className="py-2 tabular-nums">{row.orderCount.toLocaleString("ko-KR")}</td>
                <td className="py-2 tabular-nums">{row.quantity.toLocaleString("ko-KR")}</td>
                <td className="py-2 tabular-nums">₩{row.salesAmount.toLocaleString("ko-KR")}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}
