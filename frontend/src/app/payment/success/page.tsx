"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "../../../components/header/Header";
import Footer from "../../../components/layout/Footer";
import { confirmPayment, getAccessToken } from "../../../lib/api"; // 경로에 맞게 수정

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [status, setStatus] = useState<"loading" | "success" | "fail">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // 💡 1. URL에서 토스가 보낸 3가지 핵심 데이터 추출
    const paymentKey = searchParams.get("paymentKey");
    const orderId = searchParams.get("orderId");
    const amount = searchParams.get("amount");

    if (!paymentKey || !orderId || !amount) {
      setStatus("fail");
      setErrorMessage("결제 정보가 올바르지 않습니다.");
      return;
    }

    // 💡 2. 백엔드에 최종 결제 승인 요청 (이름을 handleConfirm으로 변경하여 충돌 방지)
    const handleConfirm = async () => {
      try {
        await confirmPayment({
          paymentKey,
          orderId,
          amount: Number(amount),
        });

        // 에러 없이 통과했다면 성공 처리 및 프론트엔드 장바구니 초기화
        window.dispatchEvent(new Event("cartUpdated"));
        setStatus("success");

      } catch (error: any) {
        setStatus("fail");
        setErrorMessage(error.message);
      }
    };

    handleConfirm();
  }, [searchParams]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-[#f9f9f9] px-5 py-20 text-center">
      <div className="w-full max-w-[500px] bg-white p-10 shadow-sm border border-black/10">
        {status === "loading" && (
          <>
            <h2 className="mb-4 text-[18px] font-bold">결제 승인 중입니다...</h2>
            <p className="text-[12px] text-[#777]">창을 닫거나 새로고침하지 마세요.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mb-6 text-[40px]">✔️</div>
            <h2 className="mb-4 text-[20px] font-bold">결제가 완료되었습니다!</h2>
            <p className="mb-8 text-[12px] text-[#777]">
              주문 번호: {searchParams.get("orderId")}
            </p>
            <Link 
              href="/shop" 
              className="inline-block bg-black px-8 py-3 text-[12px] tracking-[0.1em] text-white transition hover:bg-[#333]"
            >
              쇼핑 계속하기
            </Link>
          </>
        )}

        {status === "fail" && (
          <>
            <div className="mb-6 text-[40px]">❌</div>
            <h2 className="mb-4 text-[20px] font-bold text-red-500">결제 실패</h2>
            <p className="mb-8 text-[12px] text-[#777]">{errorMessage}</p>
            <Link 
              href="/checkout" 
              className="inline-block border border-black px-8 py-3 text-[12px] tracking-[0.1em] transition hover:bg-black hover:text-white"
            >
              다시 시도하기
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

// Next.js에서 useSearchParams를 안전하게 사용하기 위해 Suspense로 감쌉니다.
export default function PaymentSuccessPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div className="py-20 text-center">Loading...</div>}>
        <PaymentSuccessContent />
      </Suspense>
      <Footer />
    </>
  );
}