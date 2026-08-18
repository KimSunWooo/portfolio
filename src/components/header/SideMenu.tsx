"use client";

import Icon from "../common/Icon";

const groups = [
  { title: "ABOUT", items: [{ label: "BRAND STORY", href: "/#brand" }, { label: "LOOK", href: "/#look" }] },
  { title: "SHOP", items: [{ label: "ALL", href: "/shop" }, { label: "BEST", href: "/shop#best" }, { label: "NEW", href: "/shop#new" }, { label: "BASE", href: "/shop#base" }, { label: "CHEEK", href: "/shop#cheek" }, { label: "EYE", href: "/shop#eye" }, { label: "LIP", href: "/shop#lip" }] },
  { title: "COMMUNITY", items: [{ label: "NOTICE", href: "/community" }, { label: "FAQ", href: "/community#faq" }, { label: "EVENT", href: "/community#event" }] },
];

export default function SideMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <div className={`fixed inset-0 z-[100] ${open ? "visible pointer-events-auto" : "invisible pointer-events-none"}`}>
      <button className={`absolute inset-0 h-full w-full border-0 bg-black/30 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`} aria-label="메뉴 닫기" onClick={onClose} />
      <aside className={`absolute bottom-0 left-0 top-0 w-[min(430px,88vw)] overflow-y-auto bg-white px-[30px] py-7 transition-transform duration-[420ms] ease-out ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] tracking-[0.16em]">MENU</span>
          <button className="grid h-7 w-7 place-items-center" onClick={onClose} aria-label="닫기"><Icon name="close" size={22} /></button>
        </div>
        <nav className="mt-[72px]">
          {groups.map((group) => (
            <section key={group.title} className="mb-[34px]">
              <h2 className="mb-3 text-[10px] tracking-[0.12em] text-[#777]">{group.title}</h2>
              {group.items.map((item) => <a href={item.href} key={item.label} onClick={onClose} className="block w-fit text-[15px] leading-[1.95] text-[#111] no-underline hover:opacity-50">{item.label}</a>)}
            </section>
          ))}
        </nav>
        <div className="mt-[55px] border-t border-[#ddd] pt-6">
          <a href="#" className="block text-[11px] leading-[2.25] tracking-[0.08em] text-[#111] no-underline hover:opacity-50">LOGIN</a>
          <a href="#" className="block text-[11px] leading-[2.25] tracking-[0.08em] text-[#111] no-underline hover:opacity-50">MEMBERSHIP</a>
          <a href="#" className="block text-[11px] leading-[2.25] tracking-[0.08em] text-[#111] no-underline hover:opacity-50">STORE</a>
          <a href="/community" className="block text-[11px] leading-[2.25] tracking-[0.08em] text-[#111] no-underline hover:opacity-50">CUSTOMER CENTER</a>
        </div>
      </aside>
    </div>
  );
}
