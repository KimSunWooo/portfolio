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
  {
    key: "dashboard",
    label: "DASHBOARD",
    number: "01",
  },
  {
    key: "products",
    label: "PRODUCTS",
    number: "02",
  },
  {
    key: "orders",
    label: "ORDERS",
    number: "03",
  },
  {
    key: "users",
    label: "CUSTOMERS",
    number: "04",
  },
  {
    key: "settings",
    label: "SETTINGS",
    number: "05",
  },
];

export default function ShopSidebar({
  selectedMenu,
  onSelectMenu,
}: ShopSidebarProps) {
  return (
    <aside className="w-[240px] shrink-0 border-r border-black/15 bg-[#f5f4ef]">
      <div className="sticky top-0 flex min-h-[calc(100vh-64px)] flex-col">
        {/* Sidebar title */}
        <div className="border-b border-black/15 px-6 py-6">
          <p className="text-[9px] tracking-[0.16em] text-[#777]">
            SHOP MANAGEMENT
          </p>

          <h2 className="mt-2 text-xl font-normal tracking-[-0.03em]">
            Admin
          </h2>
        </div>

        {/* Navigation */}
        <nav className="flex-1">
          {menuItems.map((item) => {
            const isActive = selectedMenu === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onSelectMenu(item.key)}
                className={[
                  "group flex w-full items-center gap-4 border-b border-black/10 px-6 py-5 text-left transition",
                  isActive
                    ? "bg-black text-white"
                    : "text-black hover:bg-black/[0.04]",
                ].join(" ")}
              >
                <span
                  className={[
                    "w-5 text-[9px] tracking-[0.12em]",
                    isActive
                      ? "text-white/50"
                      : "text-[#999]",
                  ].join(" ")}
                >
                  {item.number}
                </span>

                <span className="text-[10px] tracking-[0.14em]">
                  {item.label}
                </span>

                <span
                  className={[
                    "ml-auto text-xs transition-transform",
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

        {/* Bottom */}
        <div className="border-t border-black/15 px-6 py-5">
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