"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import {
  fetchPurchaseAnalytics,
  fetchPurchaseAnalyticsFilters,
  type PurchaseAnalyticsFilters,
  type PurchaseAnalyticsResponse,
} from "@/lib/api";
import { BarChart, MetricTable } from "./PurchaseCharts";

function seoulToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function daysAgo(days: number): string {
  const parts = seoulToday().split("-").map(Number);
  const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

type Mode = "summary" | "full";

export default function PurchaseAnalyticsPanel({ mode }: { mode: Mode }) {
  const formId = useId();
  const [from, setFrom] = useState(daysAgo(29));
  const [to, setTo] = useState(seoulToday());
  const [grain, setGrain] = useState("DAY");
  const [metric, setMetric] = useState("SALES_AMOUNT");
  const [topN, setTopN] = useState(5);
  const [recordSource, setRecordSource] = useState("ALL");
  const [products, setProducts] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [ageBands, setAgeBands] = useState<string[]>([]);
  const [options, setOptions] = useState<PurchaseAnalyticsFilters | null>(null);
  const filterKey = [
    from,
    to,
    grain,
    metric,
    String(topN),
    recordSource,
    products.join("\0"),
    categories.join("\0"),
    ageBands.join("\0"),
  ].join("|");
  const [snapshot, setSnapshot] = useState<{
    key: string;
    data: PurchaseAnalyticsResponse | null;
    error: string | null;
  }>({ key: "", data: null, error: null });
  const loading = snapshot.key !== filterKey;
  const data = snapshot.key === filterKey ? snapshot.data : null;
  const error = snapshot.key === filterKey ? snapshot.error : null;

  useEffect(() => {
    let cancelled = false;
    void fetchPurchaseAnalyticsFilters()
      .then((filters) => {
        if (!cancelled) {
          setOptions(filters);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOptions({ products: [], categories: [], ageBands: [], recordSources: ["ALL", "LIVE", "DEMO"] });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const activeKey = filterKey;
    void fetchPurchaseAnalytics({
      from,
      to,
      grain,
      metric,
      topN,
      recordSource,
      products,
      categories,
      ageBands,
    })
      .then((analytics) => {
        if (!cancelled) {
          setSnapshot({ key: activeKey, data: analytics, error: null });
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setSnapshot({
            key: activeKey,
            data: null,
            error: caught instanceof Error ? caught.message : "구매 분석을 불러오지 못했습니다.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [filterKey, from, to, grain, metric, topN, recordSource, products, categories, ageBands]);

  const resetFilters = () => {
    setFrom(daysAgo(29));
    setTo(seoulToday());
    setGrain("DAY");
    setMetric("SALES_AMOUNT");
    setTopN(5);
    setRecordSource("ALL");
    setProducts([]);
    setCategories([]);
    setAgeBands([]);
  };

  const toggle = (values: string[], value: string, setter: (next: string[]) => void) => {
    setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  };

  const summary = data?.summary;
  const defaultRangeLabel = `${daysAgo(29)} ~ ${seoulToday()}`;
  const isDefaultRange = from === daysAgo(29) && to === seoulToday();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] tracking-[0.16em] text-[#777]">
            {mode === "summary" ? "01 · PURCHASE OVERVIEW" : "PURCHASE ANALYTICS"}
          </p>
          <h2 className="mt-1 text-2xl tracking-[-0.03em]">
            {mode === "summary" ? "구매 요약" : "구매 분석"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-[#555]">
            저장된 구매기록을 집계한 현황입니다. 시연용 기록이 포함될 수 있으며, 외부 결제 연동 실적과는
            구분됩니다.
          </p>
          <p
            className="mt-3 text-[12px] text-[#444]"
            data-testid="purchase-applied-range"
          >
            적용 기간: {from} ~ {to} (Asia/Seoul)
            {isDefaultRange ? " · 기본값 최근 30일" : " · 사용자 선택 기간"}
          </p>
        </div>
        {mode === "summary" ? (
          <Link
            href="/admin/purchases"
            className="inline-flex border border-black px-4 py-2 text-[10px] tracking-[0.14em] transition hover:bg-black hover:text-white"
          >
            상세 분석 →
          </Link>
        ) : (
          <Link
            href="/admin/shop"
            className="inline-flex border border-black/20 px-4 py-2 text-[10px] tracking-[0.14em] transition hover:bg-black hover:text-white"
          >
            ← SHOP DASHBOARD
          </Link>
        )}
      </div>

      {data?.includesDemoRecords && (
        <p
          role="status"
          className="border border-[#c4b28a] bg-[#f7f1df] px-3 py-2 text-[12px] text-[#5c4b1f]"
        >
          시연용 구매기록 포함 · {data.sourceLabel}
        </p>
      )}

      <form
        className="grid gap-3 border border-black/10 bg-white p-4 md:grid-cols-2 lg:grid-cols-4"
        onSubmit={(event) => event.preventDefault()}
        aria-labelledby={`${formId}-filters`}
      >
        <h3 id={`${formId}-filters`} className="sr-only">구매 분석 필터</h3>
        <label className="text-[11px] tracking-[0.12em] text-[#666]">
          시작일
          <input
            type="date"
            className="mt-1 w-full border border-black/15 bg-[#faf9f6] px-2 py-2 text-sm text-black"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </label>
        <label className="text-[11px] tracking-[0.12em] text-[#666]">
          종료일
          <input
            type="date"
            className="mt-1 w-full border border-black/15 bg-[#faf9f6] px-2 py-2 text-sm text-black"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </label>
        <fieldset className="text-[11px] tracking-[0.12em] text-[#666]">
          <legend>빠른 기간</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                type="button"
                className="border border-black/20 px-2 py-1 hover:bg-black hover:text-white"
                onClick={() => {
                  setFrom(daysAgo(days - 1));
                  setTo(seoulToday());
                }}
              >
                최근 {days}일
              </button>
            ))}
          </div>
        </fieldset>
        <label className="text-[11px] tracking-[0.12em] text-[#666]">
          집계 단위
          <select
            className="mt-1 w-full border border-black/15 bg-[#faf9f6] px-2 py-2 text-sm"
            value={grain}
            onChange={(event) => setGrain(event.target.value)}
          >
            <option value="DAY">일별</option>
            <option value="WEEK">주별(월요일 시작)</option>
            <option value="MONTH">월별</option>
          </select>
        </label>
        <label className="text-[11px] tracking-[0.12em] text-[#666]">
          차트 지표
          <select
            className="mt-1 w-full border border-black/15 bg-[#faf9f6] px-2 py-2 text-sm"
            value={metric}
            onChange={(event) => setMetric(event.target.value)}
          >
            <option value="SALES_AMOUNT">상품 판매금액</option>
            <option value="QUANTITY">판매 수량</option>
            <option value="ORDER_COUNT">구매 주문 수</option>
          </select>
        </label>
        <label className="text-[11px] tracking-[0.12em] text-[#666]">
          기록 출처
          <select
            className="mt-1 w-full border border-black/15 bg-[#faf9f6] px-2 py-2 text-sm"
            value={recordSource}
            onChange={(event) => setRecordSource(event.target.value)}
          >
            <option value="ALL">전체</option>
            <option value="LIVE">실제 구매(LIVE)</option>
            <option value="DEMO">시연 기록(DEMO)</option>
          </select>
        </label>
        {mode === "full" && (
          <>
            <label className="text-[11px] tracking-[0.12em] text-[#666]">
              Top N
              <input
                type="number"
                min={1}
                max={20}
                className="mt-1 w-full border border-black/15 bg-[#faf9f6] px-2 py-2 text-sm"
                value={topN}
                onChange={(event) => setTopN(Number(event.target.value) || 5)}
              />
            </label>
            <MultiSelect
              label="상품"
              options={options?.products ?? []}
              selected={products}
              onToggle={(value) => toggle(products, value, setProducts)}
            />
            <MultiSelect
              label="상품분류"
              options={options?.categories ?? []}
              selected={categories}
              onToggle={(value) => toggle(categories, value, setCategories)}
            />
            <MultiSelect
              label="연령대"
              options={options?.ageBands ?? []}
              selected={ageBands}
              onToggle={(value) => toggle(ageBands, value, setAgeBands)}
            />
          </>
        )}
        <div className="flex items-end">
          <button
            type="button"
            onClick={resetFilters}
            className="border border-black/20 px-4 py-2 text-[10px] tracking-[0.14em] hover:bg-black hover:text-white"
          >
            필터 초기화
          </button>
        </div>
      </form>

      {loading && <p className="text-sm text-[#666]">집계를 불러오는 중…</p>}
      {error && (
        <p role="alert" className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          조회 오류: {error}
        </p>
      )}
      {!loading && !error && data && summary && summary.orderCount === 0 && (
        <p role="status" className="border border-black/10 bg-white px-3 py-4 text-sm text-[#666]">
          선택한 조건({from} ~ {to})에 구매기록이 없습니다. 시작일·종료일이나 「최근 7/30/90일」로
          기간을 바꿔 다시 조회하세요. 시연 DEMO 시드는 여러 월에 걸쳐 있으며, 기본 최근 30일에
          포함되지 않은 달은 이 화면에서 자동으로 기간을 넓히지 않습니다.
          {isDefaultRange ? ` (기본 기간 예: ${defaultRangeLabel})` : ""}
        </p>
      )}

      {summary && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SummaryCard label="구매 주문 수" value={`${summary.orderCount.toLocaleString("ko-KR")}건`} />
          <SummaryCard label="판매 수량" value={`${summary.quantity.toLocaleString("ko-KR")}개`} />
          <SummaryCard label="상품 판매금액" value={`₩${summary.salesAmount.toLocaleString("ko-KR")}`} />
        </div>
      )}

      {data && mode === "summary" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <BarChart title={`기간별 ${metricLabel(metric)} 추이`} items={data.trend} metric={metric} />
          <BarChart title={`상품분류별 ${metricLabel(metric)} 비교`} items={data.categories} metric={metric} horizontal />
        </div>
      )}

      {data && mode === "full" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <BarChart title={`기간별 ${metricLabel(metric)} 추이`} items={data.trend} metric={metric} />
          <BarChart title={`상품별 ${metricLabel(metric)} 비교`} items={data.products} metric={metric} horizontal />
          <BarChart title={`상품분류별 ${metricLabel(metric)} 비교`} items={data.categories} metric={metric} horizontal />
          <BarChart title={`연령대별 ${metricLabel(metric)} 비교`} items={data.ages} metric={metric} horizontal />
        </div>
      )}

      {mode === "full" && data && (
        <div className="space-y-4">
          <MetricTable title="상품별 상세" rows={data.rows} />
          <MetricTable title="분류별 상세" rows={data.categories} />
          <MetricTable title="연령대별 상세" rows={data.ages} />
          <p className="text-[11px] leading-5 text-[#777]">
            시간대 {data.timezone}. {data.aggregatedAtMeaning} 분류별 주문 수는 한 주문이 여러 분류에
            있으면 합계가 전체 주문 수보다 클 수 있습니다. 취소·환불은 저장된 상태만 반영합니다.
          </p>
        </div>
      )}
    </div>
  );
}

function metricLabel(metric: string): string {
  if (metric === "QUANTITY") return "판매 수량";
  if (metric === "ORDER_COUNT") return "구매 주문 수";
  return "상품 판매금액";
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="border border-black/10 bg-white px-4 py-5">
      <p className="text-[10px] tracking-[0.14em] text-[#777]">{label}</p>
      <p className="mt-3 text-2xl tracking-[-0.03em]">{value}</p>
    </article>
  );
}

function MultiSelect({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <fieldset className="text-[11px] tracking-[0.12em] text-[#666] md:col-span-2">
      <legend>{label}</legend>
      <div className="mt-2 flex max-h-28 flex-wrap gap-2 overflow-y-auto">
        {options.length === 0 ? (
          <span className="text-[#999]">선택 가능한 값이 없습니다.</span>
        ) : (
          options.map((option) => {
            const active = selected.includes(option);
            return (
              <label
                key={option}
                className={[
                  "inline-flex cursor-pointer items-center gap-1 border px-2 py-1",
                  active ? "border-black bg-black text-white" : "border-black/20",
                ].join(" ")}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={active}
                  onChange={() => onToggle(option)}
                />
                {option}
              </label>
            );
          })
        )}
      </div>
    </fieldset>
  );
}
