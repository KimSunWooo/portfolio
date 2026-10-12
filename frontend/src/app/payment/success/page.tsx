"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "../../../components/header/Header";
import Footer from "../../../components/layout/Footer";
import { confirmPayment, ensureAccessToken, isAccessTokenValid } from "../../../lib/api";

const confirmingPayments = new Set<string>();

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const paymentKey = searchParams.get("paymentKey");
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");
  const missingPayment = !paymentKey || !orderId || !amount;
  const [status, setStatus] = useState<"loading" | "canceled" | "fail">(missingPayment ? "fail" : "loading");
  const [errorMessage, setErrorMessage] = useState(missingPayment ? "결제 정보가 올바르지 않습니다." : "");

  useEffect(() => {
    if (!paymentKey || !orderId || !amount) {
      return;
    }

    if (confirmingPayments.has(paymentKey)) {
      return;
    }
    confirmingPayments.add(paymentKey);
    let ignore = false;

    const handleConfirm = async () => {
      const token = await ensureAccessToken();
      if (!isAccessTokenValid(token)) {
        if (!ignore) {
          setStatus("fail");
          setErrorMessage("로그인이 필요합니다. 인증이 복구된 뒤에만 결제를 확인합니다.");
        }
        confirmingPayments.delete(paymentKey);
        return;
      }

      try {
        const result = await confirmPayment({
          paymentKey,
          orderId,
          amount: Number(amount),
        });
        if (ignore) return;
        if (result?.status === "CANCELED") {
          setStatus("canceled");
          return;
        }
        setStatus("fail");
        setErrorMessage(result?.message || "결제 상태를 확인하지 못했습니다.");
      } catch (error: unknown) {
        if (ignore) return;
        setStatus("fail");
        setErrorMessage(error instanceof Error ? error.message : "결제 확인에 실패했습니다.");
      } finally {
        confirmingPayments.delete(paymentKey);
      }
    };

    handleConfirm();
    return () => {
      ignore = true;
    };
  }, [paymentKey, orderId, amount]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-[#f9f9f9] px-5 py-20 text-center">
      <div className="w-full max-w-[500px] border border-black/10 bg-white p-10 shadow-sm">
        <p className="mb-6 text-[11px] tracking-[0.08em] text-[#777]">100원 테스트 결제</p>
        {status === "loading" && (
          <>
            <h2 className="mb-4 text-[18px] font-bold">결제 승인과 자동 취소를 확인하는 중입니다.</h2>
            <p className="text-[12px] text-[#777]">인증 복구가 끝난 뒤에 한 번만 요청합니다.</p>
          </>
        )}

        {status === "canceled" && (
          <>
            <h2 className="mb-4 text-[20px] font-bold">테스트 결제가 승인된 뒤 자동 취소되었습니다.</h2>
            <p className="mb-3 text-[12px] leading-6 text-[#777]">
              주문 번호: {orderId}
            </p>
            <p className="mb-8 text-[12px] leading-6 text-[#777]">
              실결제가 아니며 장바구니는 주문 완료로 비우지 않습니다.
            </p>
            <Link
              href="/mypage"
              className="inline-block bg-black px-8 py-3 text-[12px] tracking-[0.1em] text-white transition hover:bg-[#333]"
            >
              취소 내역 보기
            </Link>
          </>
        )}

        {status === "fail" && (
          <>
            <h2 className="mb-4 text-[20px] font-bold">결제 확인에 실패했습니다.</h2>
            <p className="mb-8 text-[12px] leading-6 text-[#777]">{errorMessage}</p>
            <Link
              href={errorMessage.includes("로그인") ? "/login?next=/payment/success" : "/checkout"}
              className="inline-block border border-black px-8 py-3 text-[12px] tracking-[0.1em] transition hover:bg-black hover:text-white"
            >
              {errorMessage.includes("로그인") ? "로그인" : "다시 시도"}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

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
