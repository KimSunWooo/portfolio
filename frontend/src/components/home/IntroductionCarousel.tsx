"use client";

import { useId, useMemo, useRef, useState, type PointerEvent } from "react";
import MarkdownContent from "../common/MarkdownContent";
import type { ResumeIntroduction } from "../../lib/api";
import { splitIntroductionSections } from "./introductionSections";
import styles from "./IntroductionCarousel.module.css";

type Drag = {
  pointerId: number;
  x: number;
  y: number;
  scrollLeft: number;
  index: number;
  moved: boolean;
};

const formatNumber = (value: number) => String(value).padStart(2, "0");

export default function IntroductionCarousel({
  introductions,
  showHeader = true,
}: {
  introductions: ResumeIntroduction[];
  showHeader?: boolean;
}) {
  const entries = useMemo(
    () => introductions.map((item) => ({ ...item, ...splitIntroductionSections(item.content) }))
      .filter((item) => item.sections.length > 0),
    [introductions],
  );
  const [firstEntry] = entries;
  const slides = entries.flatMap((item, entryIndex) =>
    item.sections.map((section, sectionIndex) => ({
      id: item.id + "-" + section.id,
      title: entryIndex > 0 && section.id === "full" ? item.title || section.title : section.title,
      entryTitle: entryIndex > 0 && sectionIndex === 0 && section.id !== "full" ? item.title : "",
      lead: entryIndex > 0 && sectionIndex === 0 ? item.lead : "",
      body: section.body,
    })),
  );
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const titleId = useId();
  const count = slides.length;
  const index = Math.max(0, Math.min(currentIndex, count - 1));

  function goTo(nextIndex: number) {
    const element = viewport.current;
    if (!element) return;
    const target = Math.max(0, Math.min(nextIndex, count - 1));
    element.scrollTo({ left: target * element.clientWidth, behavior: "auto" });
  }

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (count < 2 || event.pointerType !== "mouse" || event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest("a, button, input, textarea, select, [contenteditable]")) return;
    drag.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      scrollLeft: event.currentTarget.scrollLeft,
      index,
      moved: false,
    };
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const gesture = drag.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const distance = event.clientX - gesture.x;
    if (!gesture.moved) {
      if (Math.abs(distance) < 8 || Math.abs(distance) <= Math.abs(event.clientY - gesture.y)) return;
      gesture.moved = true;
      event.currentTarget.dataset.dragging = "";
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    event.preventDefault();
    event.currentTarget.scrollLeft = gesture.scrollLeft - distance;
  }

  function finishDrag(event: PointerEvent<HTMLDivElement>, cancelled = false) {
    const gesture = drag.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    drag.current = null;
    if (!gesture.moved) return;
    const distance = event.clientX - gesture.x;
    const threshold = Math.min(72, event.currentTarget.clientWidth / 5);
    const step = cancelled || Math.abs(distance) < threshold ? 0 : distance < 0 ? 1 : -1;
    delete event.currentTarget.dataset.dragging;
    goTo(gesture.index + step);
  }

  const heading = firstEntry?.heading || firstEntry?.title || "자기소개";

  return (
    <section aria-labelledby={showHeader ? titleId : undefined} aria-label={showHeader ? undefined : "자기소개 슬라이드"} className={styles.root}>
      {showHeader && (
        <header className={styles.header}>
          <p className={styles.kicker}>04 / INTRODUCTION</p>
          <h2 id={titleId} className={styles.title}>
            {heading}
          </h2>
          {firstEntry?.lead && (
            <div className={styles.lead}>
              <MarkdownContent content={firstEntry.lead} />
            </div>
          )}
        </header>
      )}

      {count === 0 ? (
        <p className="mt-8 rounded-3xl border border-black/15 p-6 text-sm text-[#53534a]">
          자기소개를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.
        </p>
      ) : (
        <div className={showHeader ? styles.card : `${styles.card} mt-0`}>
          {count > 1 && (
            <div className="flex items-center justify-between gap-3 border-b border-black/15 px-5 py-3 sm:px-8 sm:py-4">
              <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
                <span aria-live="polite" aria-atomic="true" className="whitespace-nowrap font-mono text-xs tracking-[0.12em] text-[#25251f]">
                  {formatNumber(index + 1)} / {formatNumber(count)}
                  <span className="sr-only"> {slides[index].title}</span>
                </span>
                <span className="text-[11px] text-[#53534a]">드래그 또는 화살표로 이동</span>
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" aria-label="이전 자기소개" disabled={index === 0} onClick={() => goTo(index - 1)} className={styles.arrow}>
                  <span aria-hidden="true">←</span>
                </button>
                <button type="button" aria-label="다음 자기소개" disabled={index === count - 1} onClick={() => goTo(index + 1)} className={styles.arrow}>
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>
          )}

          <div
            ref={viewport}
            role="region"
            aria-label="자기소개 슬라이드"
            tabIndex={count > 1 ? 0 : undefined}
            className={styles.viewport}
            data-draggable={count > 1 ? "" : undefined}
            onScroll={(event) => {
              if (drag.current?.moved) return;
              const { scrollLeft, clientWidth } = event.currentTarget;
              if (clientWidth > 0) setCurrentIndex(Math.round(scrollLeft / clientWidth));
            }}
            onKeyDown={(event) => {
              if (event.target !== event.currentTarget || count < 2) return;
              if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
              event.preventDefault();
              goTo(index + (event.key === "ArrowRight" ? 1 : -1));
            }}
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={finishDrag}
            onPointerCancel={(event) => finishDrag(event, true)}
            onLostPointerCapture={(event) => finishDrag(event, true)}
            onPointerLeave={() => {
              if (!drag.current?.moved) drag.current = null;
            }}
            onDragStart={(event) => {
              if (drag.current) event.preventDefault();
            }}
          >
            {slides.map((slide, slideIndex) => (
              <article
                key={slide.id}
                className={styles.slide}
                inert={slideIndex !== index}
                aria-hidden={slideIndex !== index}
                aria-label={(slideIndex + 1) + " / " + count + " · " + slide.title}
              >
                <div className={styles.chapter}>
                  <div className={styles.orbit} aria-hidden="true">
                    <svg viewBox="0 0 192 192" fill="none" className="absolute inset-0 h-full w-full">
                      <circle cx="96" cy="96" r="77" stroke="currentColor" strokeOpacity=".28" />
                      <ellipse cx="96" cy="96" rx="83" ry="52" transform="rotate(-32 96 96)" stroke="currentColor" strokeOpacity=".32" />
                      <path d="M154 45v24m-12-12h24m-20-8 16 16m0-16-16 16" stroke="currentColor" strokeOpacity=".6" />
                      <circle cx="40" cy="137" r="3" fill="currentColor" fillOpacity=".72" />
                    </svg>
                    <span className={styles.orbitNumber}>{formatNumber(slideIndex + 1)}</span>
                  </div>
                  <p aria-hidden="true" className={styles.chapterLabel}>
                    CHAPTER / {formatNumber(slideIndex + 1)}
                  </p>
                </div>
                <div className={styles.slideCopy}>
                  {slide.entryTitle && <p className={styles.entryTitle}>{slide.entryTitle}</p>}
                  <h3 className={styles.slideTitle}>{slide.title}</h3>
                  <div className={styles.body}>
                    <MarkdownContent content={[slide.lead, slide.body].filter(Boolean).join("\n\n")} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
