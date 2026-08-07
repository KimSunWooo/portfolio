"use client";

import { useState } from "react";
import Icon from "../common/Icon";
import SideMenu from "./SideMenu";
import SearchPanel from "./SearchPanel";

export default function Header({ cartCount = 0 }: { cartCount?: number }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 grid h-[76px] grid-cols-[1fr_auto_1fr] items-center border-b border-black/[0.06] bg-white/90 px-7 backdrop-blur-xl max-sm:h-[62px] max-sm:px-4">
        <button className="grid h-7 w-7 place-items-center" aria-label="메뉴 열기" onClick={() => setMenuOpen(true)}>
          <Icon name="menu" size={22} />
        </button>
        <a href="/" className="text-[22px] font-semibold tracking-[-0.05em] text-[#111] no-underline max-sm:text-[19px]">atelier</a>
        <div className="flex items-center justify-end gap-[18px] max-sm:gap-3">
          <button className="grid h-7 w-7 place-items-center" aria-label="검색" onClick={() => setSearchOpen(true)}>
            <Icon name="search" size={21} />
          </button>
          <a className="relative grid h-7 w-7 place-items-center" href="/cart" aria-label="장바구니">
            <Icon name="bag" size={21} />
            {cartCount > 0 && <span className="absolute -right-[7px] -top-[5px] grid h-[15px] min-w-[15px] place-items-center rounded-full bg-[#151515] px-[3px] text-[8px] text-white">{cartCount}</span>}
          </a>
          <a className="text-[10px] tracking-[0.1em] text-[#151515] no-underline max-sm:hidden" href="/login">LOGIN</a>
        </div>
      </header>
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
