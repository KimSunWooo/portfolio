"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../../components/header/Header";
import Footer from "../../components/layout/Footer";
import {
  fetchPaymentHistory,
  fetchDemoOrders,
  cancelDemoOrder,
  type PaymentHistoryResponse,
  type DemoOrderResponse,
  ensureAccessToken,
  isAccessTokenValid,
} from "../../lib/api";

type Tab = "DONE" | "CANCELED" | "ORDERS";

function MyPageContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab) || "DONE";
  const [activeTab, setActiveTab] = useState<Tab>(
    initialTab === "ORDERS" || initialTab === "CANCELED" || initialTab === "DONE" ? initialTab : "DONE"
  );
  const [histories, setHistories] = useState<PaymentHistoryResponse[]>([]);
  const [orders, setOrders] = useState<DemoOrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const router = useRouter();

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        const token = await ensureAccessToken();
        if (!isAccessTokenValid(token)) {
          router.replace("/login?next=/mypage");
          return;
        }
        const savedNotice = sessionStorage.getItem("demoOrderNotice");
        if (savedNotice) {
          sessionStorage.removeItem("demoOrderNotice");
          setNotice(savedNotice);
        }
        if (activeTab === "ORDERS") {
          setOrders(await fetchDemoOrders());
          setHistories([]);
        } else {
          setHistories(await fetchPaymentHistory(activeTab));
          setOrders([]);
        }
      } catch (error) {
        console.error("내역 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [activeTab, router]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  return (
    <div className="mx-auto max-w-[900px] border border-black/10 bg-white p-10 shadow-sm max-sm:p-5">
      <h1 className="mb-10 text-center text-[24px] font-normal tracking-[-0.025em]">MY PAGE</h1>
      {notice && (
        <p className="mb-6 border border-black/10 bg-[#f1efec] px-4 py-3 text-[12px] text-[#333]">{notice}</p>
      )}

      <div className="mb-8 flex border-b border-black/20">
        {(
          [
            ["DONE", "승인 기록"],
            ["CANCELED", "자동 취소 내역"],
            ["ORDERS", "데모 주문"],
          ] as const
        ).map(([tab, label]) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 text-[13px] tracking-wider transition ${
              activeTab === tab ? "border-b-2 border-black font-bold text-black" : "text-[#999] hover:text-black"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-[11px] tracking-[0.1em] text-[#999]">LOADING...</div>
      ) : activeTab === "ORDERS" ? (
        orders.length === 0 ? (
          <div className="py-20 text-center text-[12px] tracking-[0.05em] text-[#777]">데모 주문이 없습니다.</div>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((order) => (
              <div key={order.orderKey} className="relative flex flex-col gap-2 border border-black/10 p-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-[11px] text-[#777]">ORDER: {order.orderKey}</span>
                  <span className={`px-2 py-1 text-[11px] font-bold ${order.status === "CONFIRMED" ? "bg-[#f1efec] text-[#111]" : "bg-red-50 text-red-600"}`}>
                    {order.status}
                  </span>
                </div>
                <div className="text-[15px] font-bold">₩{order.paidAmount.toLocaleString()}</div>
                <ul className="space-y-1 text-[11px] text-[#555]">
                  {order.lines.map((line, index) => (
                    <li key={`${order.orderKey}-${index}`}>
                      {line.productName} × {line.quantity} · {line.status}
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex items-end justify-between">
                  <span className="text-[11px] text-[#555]">주문일시: {formatDate(order.purchasedAt)}</span>
                  {order.status === "CONFIRMED" && (
                    <button
                      type="button"
                      className="border border-black px-3 py-2 text-[10px] tracking-[0.1em]"
                      onClick={async () => {
                        try {
                          await cancelDemoOrder(order.orderKey);
                          setOrders(await fetchDemoOrders());
                        } catch (error) {
                          alert(error instanceof Error ? error.message : "주문 취소에 실패했습니다.");
                        }
                      }}
                    >
                      취소
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : histories.length === 0 ? (
        <div className="py-20 text-center text-[12px] tracking-[0.05em] text-[#777]">내역이 없습니다.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {histories.map((history) => (
            <div key={history.id} className="relative flex flex-col gap-2 border border-black/10 p-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[11px] text-[#777]">ORDER: {history.orderId}</span>
                <span className={`px-2 py-1 text-[11px] font-bold ${history.status === "DONE" ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-600"}`}>
                  {history.status === "DONE" ? "결제완료" : "취소완료"}
                </span>
              </div>
              <div className="text-[15px] font-bold">₩{history.amount.toLocaleString()}</div>
              <div className="mt-2 flex flex-col gap-1 text-[11px] text-[#555]">
                {history.status === "DONE" ? (
                  <span>결제일시: {formatDate(history.createdAt)}</span>
                ) : (
                  <>
                    <span>취소일시: {formatDate(history.canceledAt || history.createdAt)}</span>
                    <span className="text-red-500">사유: {history.cancelReason}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MyPage() {
  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-74px)] bg-[#f9f9f9] px-5 py-20">
        <Suspense fallback={<div className="py-20 text-center">Loading...</div>}>
          <MyPageContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
