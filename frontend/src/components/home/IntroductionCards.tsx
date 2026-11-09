"use client";

import { useId, useMemo, useState } from "react";
import MarkdownContent from "../common/MarkdownContent";
import { splitIntroductionSections } from "./introductionSections";

type IntroductionCardsProps = {
  title: string;
  content: string;
};

export default function IntroductionCards({ title, content }: IntroductionCardsProps) {
  const { lead, sections } = useMemo(() => splitIntroductionSections(content), [content]);
  const [openIds, setOpenIds] = useState<string[]>([]);
  const baseId = useId();

  const toggle = (id: string) => {
    setOpenIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
      {sections.length > 1 && (
        <aside className="hidden lg:block">
          <nav
            aria-label="자기소개 목차"
            className="sticky top-24 space-y-3 border border-[#ddd] bg-[#f1efec] p-4"
          >
            <p className="text-[9px] tracking-[0.14em] text-[#888]">CONTENTS</p>
            <ul className="space-y-2">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${baseId}-${section.id}`}
                    className="text-[12px] leading-5 text-[#111] no-underline hover:opacity-60"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      )}

      <div className="min-w-0 space-y-8">
        <div>
          <p className="text-[25px] tracking-[0.16em] text-[#777] max-sm:text-[18px]">
            04 · INTRODUCTION
          </p>
          <h2 className="mt-4 text-[clamp(28px,5vw,64px)] font-normal leading-[1.1] tracking-[-0.05em] text-[#111]">
            {title}
          </h2>
          {lead && (
            <div className="mt-8 max-w-[46rem] border border-[#ddd] bg-white p-6 max-sm:p-4">
              <MarkdownContent content={lead} variant="light" />
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {sections.map((section) => {
            const open = openIds.includes(section.id);
            const panelId = `${baseId}-panel-${section.id}`;
            const buttonId = `${baseId}-button-${section.id}`;
            return (
              <article
                key={section.id}
                id={`${baseId}-${section.id}`}
                className={`border border-[#ddd] bg-white ${open ? "md:col-span-2" : ""}`}
              >
                <h3 className="border-b border-[#ddd] bg-[#f1efec] px-5 py-4 text-[16px] tracking-[-0.02em] text-[#111]">
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => toggle(section.id)}
                    className="flex w-full items-start justify-between gap-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                  >
                    <span>{section.title}</span>
                    <span className="shrink-0 text-[10px] tracking-[0.14em] text-[#777]">
                      {open ? "접기" : "펼치기"}
                    </span>
                  </button>
                </h3>
                {!open && (
                  <p className="px-5 py-4 text-[13px] leading-6 text-[#555]">{section.preview}</p>
                )}
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  hidden={!open}
                  className="border-t border-[#ddd] px-5 py-5"
                >
                  {open && <MarkdownContent content={section.body} variant="light" />}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
