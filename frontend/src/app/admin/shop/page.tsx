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
  const [selectedMenu, setSelectedMenu] =
    useState<ShopMenu>("dashboard");

  return (
    <div className="min-h-screen bg-[#f5f4ef]">
      <ShopHeader />

      <div className="flex min-h-[calc(100vh-64px)]">
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