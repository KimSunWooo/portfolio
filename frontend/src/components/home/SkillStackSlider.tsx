"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import type { ResumeSkill } from "../../lib/api";
import { skillVisual } from "./skillMeta";
import styles from "./SkillStackSlider.module.css";

type SkillStackSliderProps = {
  skills: ResumeSkill[];
};

function pageSizeForWidth(width: number) {
  if (width >= 1100) return 4;
  if (width >= 768) return 3;
  return 2;
}

export default function SkillStackSlider({ skills }: SkillStackSliderProps) {
  const ordered = useMemo(
    () => [...skills].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [skills],
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointerId: number; x: number; page: number } | null>(null);
  const [pageSize, setPageSize] = useState(4);
  const [page, setPage] = useState(0);
  const labelId = useId();
  const pageCount = Math.max(1, Math.ceil(ordered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);

  useEffect(() => {
    const element = rootRef.current;
    if (!element) return;
    const update = () => {
      const next = pageSizeForWidth(element.clientWidth);
      setPageSize((current) => (current === next ? current : next));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const goTo = useCallback(
    (next: number) => {
      setPage(Math.max(0, Math.min(next, pageCount - 1)));
    },
    [pageCount],
  );

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(safePage + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(safePage - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      goTo(0);
    } else if (event.key === "End") {
      event.preventDefault();
      goTo(pageCount - 1);
    }
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    drag.current = { pointerId: event.pointerId, x: event.clientX, page: safePage };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const gesture = drag.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    drag.current = null;
    const delta = event.clientX - gesture.x;
    if (Math.abs(delta) < 48) return;
    goTo(gesture.page + (delta < 0 ? 1 : -1));
  }

  const start = safePage * pageSize;
  const visible = ordered.slice(start, start + pageSize);

  return (
    <div ref={rootRef} className={styles.root}>
      <div className={styles.toolbar}>
        <p id={labelId} className={styles.meta} aria-live="polite">
          {safePage + 1} / {pageCount}
          <span className="sr-only"> 기술 스택 페이지</span>
        </p>
        <div className={styles.controls}>
          <button
            type="button"
            className={styles.arrow}
            aria-label="이전 기술 묶음"
            disabled={safePage === 0}
            onClick={() => goTo(safePage - 1)}
          >
            ←
          </button>
          <button
            type="button"
            className={styles.arrow}
            aria-label="다음 기술 묶음"
            disabled={safePage >= pageCount - 1}
            onClick={() => goTo(safePage + 1)}
          >
            →
          </button>
        </div>
      </div>

      <div
        role="region"
        aria-labelledby={labelId}
        tabIndex={0}
        className={styles.viewport}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        <ul
          className={styles.track}
          style={{
            gridTemplateColumns: `repeat(${pageSize}, minmax(0, 1fr))`,
          }}
        >
          {visible.map((skill) => {
            const visual = skillVisual(skill.name, skill.category);
            return (
              <li key={skill.id} className={styles.card}>
                <div className={styles.logoWrap}>
                  <img
                    src={visual.logoSrc}
                    alt={visual.logoAlt}
                    className={styles.logo}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.style.visibility = "hidden";
                    }}
                  />
                </div>
                <p className={styles.name}>{skill.name}</p>
                <p className={styles.usage}>{visual.usage}</p>
              </li>
            );
          })}
        </ul>
      </div>

      {pageCount > 1 && (
        <div className={styles.dots} role="tablist" aria-label="기술 스택 페이지">
          {Array.from({ length: pageCount }, (_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={index === safePage}
              aria-label={`${index + 1}페이지`}
              className={index === safePage ? styles.dotActive : styles.dot}
              onClick={() => goTo(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
