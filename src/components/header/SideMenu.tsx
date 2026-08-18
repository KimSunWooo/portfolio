"use client";

import Icon from "../common/Icon";

const groups = [
  {
    title: "RESUME",
    items: [
      { label: "ABOUT", href: "/#about" },
      { label: "SKILLS", href: "/#skills" },
      { label: "EXPERIENCE", href: "/#experience" },
      { label: "EDUCATION", href: "/#education" },
      { label: "INTRODUCTION", href: "/#introduction" },
    ],
  },
  {
    title: "PORTFOLIO",
    items: [
      { label: "SELECTED WORK", href: "/#projects" },
      { label: "COMMERCE DEMO", href: "/shop" },
      { label: "COMMUNITY DEMO", href: "/community" },
    ],
  },
  {
    title: "CONTACT",
    items: [
      { label: "CONTACT", href: "/#contact" },
      { label: "GITHUB ↗", href: "https://github.com/KimSunWooo" },
    ],
  },
];

export default function SideMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <div className={`fixed inset-0 z-[100] ${open ? "visible pointer-events-auto" : "invisible pointer-events-none"}`}>
      <button className={`absolute inset-0 h-full w-full border-0 bg-black/30 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`} aria-label="메뉴 닫기" onClick={onClose} />
      <aside className={`absolute bottom-0 left-0 top-0 w-[min(430px,88vw)] overflow-y-auto bg-white px-[30px] py-7 transition-transform duration-[420ms] ease-out ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] tracking-[0.16em]">KIM SUN WOO</span>
          <button className="grid h-7 w-7 place-items-center" onClick={onClose} aria-label="닫기"><Icon name="close" size={22} /></button>
        </div>
        <nav className="mt-[72px]">
          {groups.map((group) => (
            <section key={group.title} className="mb-[38px]">
              <h2 className="mb-3 text-[10px] tracking-[0.12em] text-[#777]">{group.title}</h2>
              {group.items.map((item) => (
                <a href={item.href} key={item.label} onClick={onClose} className="block w-fit text-[15px] leading-[1.95] text-[#111] no-underline hover:opacity-50">{item.label}</a>
              ))}
            </section>
          ))}
        </nav>
        <div className="mt-[55px] border-t border-[#ddd] pt-6 text-[10px] leading-[1.8] text-[#777]">
          BACKEND / FULL-STACK DEVELOPER<br />PORTFOLIO 2026
        </div>
      </aside>
    </div>
  );
}
