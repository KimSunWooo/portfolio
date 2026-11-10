"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "./CacheMetricsPanel.module.css";

const GITHUB_SOURCE =
  "https://github.com/KimSunWooo/portfolio#상품-목록-캐시-성능-측정";

type CacheMetricsPanelProps = {
  className?: string;
};

export default function CacheMetricsPanel({ className }: CacheMetricsPanelProps) {
  const [open, setOpen] = useState(() =>
    typeof window !== "undefined" && window.location.hash === "#cache-metrics",
  );
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const openedByClick = useRef(false);

  useEffect(() => {
    const onHash = () => {
      if (window.location.hash === "#cache-metrics") setOpen(true);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    if (!open || !openedByClick.current) return;
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    openedByClick.current = false;
  }, [open]);

  return (
    <div className={[styles.root, className ?? ""].join(" ")}>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primary}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => {
            setOpen((current) => {
              const next = !current;
              if (next) {
                openedByClick.current = true;
                window.history.replaceState(null, "", "#cache-metrics");
              }
              return next;
            });
          }}
        >
          {open ? "측정 결과 닫기" : "캐시 측정 결과 보기"}
        </button>
        <a
          href={GITHUB_SOURCE}
          target="_blank"
          rel="noreferrer"
          className={styles.secondary}
        >
          원본 기록 보기
        </a>
      </div>

      <div
        id="cache-metrics"
        ref={panelRef}
        className={open ? styles.panelOpen : styles.panel}
        hidden={!open}
        role="region"
        aria-label="상품 목록 캐시 측정 결과"
      >
        <div id={panelId} className={styles.inner}>
          <p className={styles.kicker}>CACHE METRICS · 격리 환경</p>
          <ul className={styles.list}>
            <li>
              <span className={styles.label}>상품 목록 SELECT</span>
              <strong>600요청 기준 캐시 OFF 591~595회 → 워밍 후 0회</strong>
            </li>
            <li>
              <span className={styles.label}>응답 시간 p50</span>
              <strong>5.54ms → 3.20ms</strong>
              <span className={styles.note}>회차별 p50 산술평균 (합산 p50 아님)</span>
            </li>
            <li>
              <span className={styles.label}>측정 조건</span>
              <strong>격리 환경 · k6 10 VU · 30초 · 각 조건 3회 비교</strong>
            </li>
            <li>
              <span className={styles.label}>응답 동일성</span>
              <strong>캐시 OFF·MISS·HIT 응답 SHA-256 대조</strong>
            </li>
          </ul>
          <p className={styles.footnote}>
            상세 원본 JSON과 측정 절차는{" "}
            <a href={GITHUB_SOURCE} target="_blank" rel="noreferrer">
              GitHub 기록
            </a>
            에서 확인할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
