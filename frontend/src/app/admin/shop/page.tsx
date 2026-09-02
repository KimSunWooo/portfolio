"use client";

import { useState } from "react";
import ShopHeader from "@/components/admin/shop/ShopHeader";
import ShopSidebar from "@/components/admin/shop/ShopSidebar";
import ShopEditor from "@/components/admin/shop/ShopEditor";

export type ShopMenu =
  | "dashboard"
  | "products"
  | "orders"
  | "users"
  | "settings";

export default function AdminShopPage() {
  const [selectedMenu, setSelectedMenu] = useState<ShopMenu>("dashboard");

  return (
    <div className="min-h-screen bg-[#f5f4ef]">
      <ShopHeader />

      {/* 💡 모바일에서는 상하 배치(flex-col), 데스크톱에서는 좌우 배치(md:flex-row) */}
      <div className="flex min-h-[calc(100vh-64px)] flex-col md:flex-row">
        
        {/* 사이드바는 ShopSidebar 내부 코드에서 반응형 탭(Tab) 형태로 자동 변환됩니다 */}
        <ShopSidebar
          selectedMenu={selectedMenu}
          onSelectMenu={setSelectedMenu}
        />

        <main className="min-w-0 flex-1">
          <ShopEditor selectedMenu={selectedMenu} />
        </main>
      </div>
    </div>
  );
}