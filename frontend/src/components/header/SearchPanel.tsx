"use client";

import { SyntheticEvent, useEffect, useState } from "react";
import Icon from "../common/Icon";

const keywords = ["파운데이션", "쿠션", "립스틱", "아이섀도우", "블러셔", "프라이머"];

export default function SearchPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const submit = (e: SyntheticEvent) => {
    e.preventDefault();
    // 검색 API 또는 라우팅을 연결하세요.
  };

  return (
    <div className={`fixed inset-0 z-[90] ${open ? "visible pointer-events-auto" : "invisible pointer-events-none"}`}>
      <button className={`absolute inset-0 h-full w-full border-0 bg-black/20 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`} aria-label="검색 닫기" onClick={onClose} />
      <section className={`absolute inset-x-0 top-0 bg-white px-8 pb-12 pt-[26px] transition-transform duration-[400ms] ease-out ${open ? "translate-y-0" : "-translate-y-full"}`}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] tracking-[0.15em]">SEARCH</span>
          <button className="grid h-7 w-7 place-items-center" onClick={onClose} aria-label="닫기"><Icon name="close" size={22} /></button>
        </div>
        <form className="mx-auto mt-[72px] flex w-full max-w-[760px] items-center border-b border-[#111]" onSubmit={submit}>
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="검색어를 입력하세요" aria-label="검색어" className="min-w-0 flex-1 border-0 bg-transparent py-4 text-[22px] outline-none placeholder:text-[#aaa]" />
          <button type="submit" aria-label="검색" className="border-0 bg-transparent"><Icon name="search" size={22} /></button>
        </form>
        <div className="mx-auto mt-[30px] w-full max-w-[760px]">
          <p className="mb-[15px] text-[10px] tracking-[0.12em] text-[#777]">추천 검색어</p>
          <div className="flex flex-wrap gap-[9px]">
            {keywords.map((item) => <button key={item} onClick={() => setKeyword(item)} className="rounded-full border border-[#ddd] bg-white px-[13px] py-[9px] text-[11px] text-[#333]">{item}</button>)}
          </div>
        </div>
      </section>
    </div>
  );
}
