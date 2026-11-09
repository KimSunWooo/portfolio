"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "../../../components/header/Header";
import Footer from "../../../components/layout/Footer";

function failCopy(code: string | null, message: string | null) {
  const normalized = (code ?? "").trim().toUpperCase();
  if (normalized === "PAY_PROCESS_CANCELED" || normalized === "USER_CANCEL" || normalized.includes("CANCEL")) {
    return {
      title: "결제를 취소했습니다.",
      detail: message?.trim() || "결제창에서 취소되어 승인을 요청하지 않았습니다.",
    };
  }
  if (normalized && message?.trim()) {
    return {
      title: "결제 요청에 실패했습니다.",
      detail: `${message.trim()} (코드: ${normalized})`,
    };
  }
  if (message?.trim()) {
    return {
      title: "결제 요청에 실패했습니다.",
      detail: message.trim(),
    };
  }
  if (normalized) {
    return {
      title: "결제 요청에 실패했습니다.",
      detail: `알 수 없는 오류 코드입니다. (${normalized})`,
    };
  }
  return {
    title: "결제에 실패했습니다.",
    detail: "오류 코드가 없어 원인을 특정하지 못했습니다. 장바구니로 돌아가 다시 시도할 수 있습니다.",
  };
}

function PaymentFailContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const message = searchParams.get("message");
  const orderId = searchParams.get("orderId");
  const copy = failCopy(code, message);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-[#f9f9f9] px-5 py-20 text-center">
      <div className="w-full max-w-[500px] border border-black/10 bg-white p-10 shadow-sm">
        <p className="mb-6 text-[11px] tracking-[0.08em] text-[#777]">100원 테스트 결제</p>
        <h2 className="mb-4 text-[20px] font-bold">{copy.title}</h2>
        <p className="mb-3 text-[12px] leading-6 text-[#777]">{copy.detail}</p>
        {orderId && (
          <p className="mb-8 text-[12px] leading-6 text-[#777]">주문 번호: {orderId}</p>
        )}
        {!orderId && <div className="mb-8" />}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/cart"
            className="inline-block bg-black px-8 py-3 text-[12px] tracking-[0.1em] text-white transition hover:bg-[#333]"
          >
            장바구니로 돌아가기
          </Link>
          <Link
            href="/checkout"
            className="inline-block border border-black px-8 py-3 text-[12px] tracking-[0.1em] transition hover:bg-black hover:text-white"
          >
            결제 다시 시도
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div className="py-20 text-center">Loading...</div>}>
        <PaymentFailContent />
      </Suspense>
      <Footer />
    </>
  );
}
