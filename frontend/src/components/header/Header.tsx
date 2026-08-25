"use client";

import { useState } from "react";
import Icon from "../common/Icon";
import SideMenu from "./SideMenu";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 grid h-[76px] grid-cols-[1fr_auto_1fr] items-center border-b border-black/[0.06] bg-white/90 px-7 backdrop-blur-xl max-sm:h-[62px] max-sm:px-4">
        <button className="grid h-7 w-7 place-items-center" aria-label="메뉴 열기" onClick={() => setMenuOpen(true)}>
          <Icon name="menu" size={22} />
        </button>
        <a href="/" className="text-[18px] font-semibold tracking-[-0.045em] text-[#111] no-underline max-sm:text-[16px]">KIM SUN WOO</a>
        <div className="flex items-center justify-end gap-[18px]">
          <a className="text-[10px] tracking-[0.1em] text-[#151515] no-underline" href="/login" target="_blank" rel="noreferrer">Log-In</a>
          <a className="text-[10px] tracking-[0.1em] text-[#151515] no-underline max-sm:hidden" href="/#contact">CONTACT</a>
          <a className="text-[10px] tracking-[0.1em] text-[#151515] no-underline" href="https://github.com/KimSunWooo" target="_blank" rel="noreferrer">GITHUB ↗</a>
        </div>
      </header>
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
