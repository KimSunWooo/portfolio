"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/header/Header";
import Footer from "../../components/layout/Footer";
import { fetchPaymentHistory, type PaymentHistoryResponse, getAccessToken, silentRefresh } from "../../lib/api";

export default function MyPage() {
  const [activeTab, setActiveTab] = useState<"DONE" | "CANCELED">("DONE");
  const [histories, setHistories] = useState<PaymentHistoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        // ==========================================
        // 💡 1. 토큰 복구 로직 추가 (기억 상실증 치료)
        // ==========================================
        let token = getAccessToken();
        if (!token) {
          try {
            token = await silentRefresh();
          } catch (error) {
            // 복구 실패 시에만 진짜 비회원이거나 세션 만료이므로 쫓아냄
            alert("로그인이 필요합니다.");
            router.replace("/login");
            return; // 💡 이후 로직 실행 방지
          }
        }

        // ==========================================
        // 💡 2. 복구된 토큰으로 안전하게 데이터 조회
        // ==========================================
        const data = await fetchPaymentHistory(activeTab);
        setHistories(data);
      } catch (error) {
        console.error("내역 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [activeTab, router]);

  // 날짜 포맷팅 함수 (2026-08-28T18:12:08 -> 2026.08.28 18:12)
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-74px)] bg-[#f9f9f9] px-5 py-20">
        <div className="mx-auto max-w-[900px] bg-white p-10 shadow-sm border border-black/10 max-sm:p-5">
          <h1 className="mb-10 text-center text-[24px] font-normal tracking-[-0.025em]">MY PAGE</h1>

          {/* 💡 탭 버튼 영역 */}
          <div className="flex border-b border-black/20 mb-8">
            <button
              onClick={() => setActiveTab("DONE")}
              className={`flex-1 py-4 text-[13px] tracking-wider transition ${
                activeTab === "DONE" ? "border-b-2 border-black font-bold text-black" : "text-[#999] hover:text-black"
              }`}
            >
              결제 완료 내역
            </button>
            <button
              onClick={() => setActiveTab("CANCELED")}
              className={`flex-1 py-4 text-[13px] tracking-wider transition ${
                activeTab === "CANCELED" ? "border-b-2 border-black font-bold text-black" : "text-[#999] hover:text-black"
              }`}
            >
              취소/환불 내역
            </button>
          </div>

          {/* 💡 내역 리스트 영역 */}
          {loading ? (
            <div className="py-20 text-center text-[11px] tracking-[0.1em] text-[#999]">LOADING...</div>
          ) : histories.length === 0 ? (
            <div className="py-20 text-center text-[12px] tracking-[0.05em] text-[#777]">
              내역이 없습니다.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {histories.map((history) => (
                <div key={history.id} className="border border-black/10 p-5 flex flex-col gap-2 relative">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[11px] text-[#777] font-mono">ORDER: {history.orderId}</span>
                    <span className={`text-[11px] font-bold px-2 py-1 ${history.status === "DONE" ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-600"}`}>
                      {history.status === "DONE" ? "결제완료" : "취소완료"}
                    </span>
                  </div>
                  
                  <div className="text-[15px] font-bold">
                    ₩{history.amount.toLocaleString()}
                  </div>
                  
                  <div className="flex justify-between items-end mt-2">
                    <div className="flex flex-col gap-1 text-[11px] text-[#555]">
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
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}