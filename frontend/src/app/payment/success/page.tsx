"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";

// 1. URL 쿼리 파라미터를 읽어오고 화면을 렌더링하는 컴포넌트
function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // 토스페이먼츠에서 결제 성공 시 넘겨주는 기본 파라미터들
  const orderId = searchParams.get("orderId");
  const paymentKey = searchParams.get("paymentKey");
  const amount = searchParams.get("amount");

  useEffect(() => {
    // 필요한 경우 여기서 백엔드 서버로 paymentKey 등을 보내어 
    // 최종 결제 승인(Confirm) 처리를 하는 API를 호출합니다.
    if (orderId && paymentKey && amount) {
      console.log("결제 승인 요청:", { orderId, paymentKey, amount });
    }
  }, [orderId, paymentKey, amount]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-green-600 mb-4">결제가 완료되었습니다!</h1>
        
        <div className="text-left mb-8 space-y-3 bg-gray-50 p-4 rounded-md">
          <p className="text-gray-700">
            <span className="font-semibold block text-sm text-gray-500">주문 번호</span> 
            {orderId || "정보 없음"}
          </p>
          <p className="text-gray-700">
            <span className="font-semibold block text-sm text-gray-500">결제 금액</span> 
            {amount ? `${Number(amount).toLocaleString()}원` : "정보 없음"}
          </p>
          <p className="text-gray-700">
            <span className="font-semibold block text-sm text-gray-500">결제 키</span> 
            <span className="text-xs break-all">{paymentKey || "정보 없음"}</span>
          </p>
        </div>

        <button 
          onClick={() => router.push("/")}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition font-medium"
        >
          홈으로 돌아가기
        </button>
      </div>
    </div>
  );
}

// 2. 외부로 내보내는 메인 페이지 컴포넌트 (Suspense 적용)
export default function PaymentSuccessPage() {
  return (
    <Suspense 
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-lg font-medium text-gray-600">결제 정보를 불러오는 중입니다...</div>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}