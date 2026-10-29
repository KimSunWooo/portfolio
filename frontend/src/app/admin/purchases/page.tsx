"use client";

import PurchaseAnalyticsPanel from "@/components/admin/purchase/PurchaseAnalyticsPanel";

export default function AdminPurchasesPage() {
  return (
    <div className="min-h-screen bg-[#f5f4ef] px-4 py-6 md:px-8 md:py-8">
      <PurchaseAnalyticsPanel mode="full" />
    </div>
  );
}
