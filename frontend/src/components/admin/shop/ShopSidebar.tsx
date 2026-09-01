"use client";

import type { ShopMenu } from "@/app/admin/shop/page";

interface ShopSidebarProps {
  selectedMenu: ShopMenu;
  onSelectMenu: (menu: ShopMenu) => void;
}

const menuItems: {
  key: ShopMenu;
  label: string;
  number: string;
}[] = [
  { key: "dashboard", label: "DASHBOARD", number: "01" },
  { key: "products", label: "PRODUCTS", number: "02" },
  { key: "orders", label: "ORDERS", number: "03" },
  { key: "users", label: "CUSTOMERS", number: "04" },
  { key: "settings", label: "SETTINGS", number: "05" },
];

export default function ShopSidebar({
  selectedMenu,
  onSelectMenu,
}: ShopSidebarProps) {
  return (
    <aside className="w-full shrink-0 border-b border-black/15 bg-[#f5f4ef] md:w-[240px] md:border-b-0 md:border-r">
      <div className="flex flex-col md:sticky md:top-0 md:min-h-[calc(100vh-64px)]">
        
        {/* 타이틀 영역 (모바일 간소화) */}
        <div className="border-b border-black/15 px-4 py-4 md:px-6 md:py-6">
          <p className="hidden text-[9px] tracking-[0.16em] text-[#777] md:block">
            SHOP MANAGEMENT
          </p>
          <h2 className="text-lg font-normal tracking-[-0.03em] md:mt-2 md:text-xl">
            Admin
          </h2>
        </div>

        {/* 네비게이션: 모바일 가로 스크롤, PC 세로 목록 */}
        <nav className="flex flex-1 overflow-x-auto custom-scrollbar md:flex-col">
          {menuItems.map((item) => {
            const isActive = selectedMenu === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onSelectMenu(item.key)}
                className={[
                  "group flex items-center gap-2 whitespace-nowrap border-r border-black/10 px-5 py-4 text-left transition md:w-full md:gap-4 md:border-b md:border-r-0 md:px-6 md:py-5",
                  isActive
                    ? "bg-black text-white"
                    : "text-black hover:bg-black/[0.04]",
                ].join(" ")}
              >
                <span
                  className={[
                    "text-[9px] tracking-[0.12em]",
                    isActive ? "text-white/50" : "text-[#999]",
                  ].join(" ")}
                >
                  {item.number}
                </span>

                <span className="text-[10px] tracking-[0.14em]">
                  {item.label}
                </span>

                <span
                  className={[
                    "hidden text-xs transition-transform md:ml-auto md:inline-block",
                    isActive
                      ? "translate-x-0 opacity-100"
                      : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-50",
                  ].join(" ")}
                >
                  →
                </span>
              </button>
            );
          })}
        </nav>

        {/* 하단 영역 (모바일 숨김) */}
        <div className="hidden border-t border-black/15 px-6 py-5 md:block">
          <p className="text-[8px] leading-4 tracking-[0.12em] text-[#999]">
            PORTFOLIO
            <br />
            COMMERCE ADMIN
          </p>
        </div>
      </div>
    </aside>
  );
}