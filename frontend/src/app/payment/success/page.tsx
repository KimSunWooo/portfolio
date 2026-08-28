"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  confirmPayment, 
  fetchCartItems, 
  removeCartItem, 
  getAccessToken, 
  silentRefresh // 💡 silentRefresh 추가 
} from "@/lib/api"; 

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [status, setStatus] = useState("결제를 승인하고 있습니다...");
  const isRequestSent = useRef(false); 

  useEffect(() => {
    const paymentKey = searchParams.get("paymentKey");
    const orderId = searchParams.get("orderId");
    const amount = searchParams.get("amount");

    if (!paymentKey || !orderId || !amount) {
      setStatus("비정상적인 접근입니다.");
      return;
    }

    if (isRequestSent.current) return;
    isRequestSent.current = true; 

    const processPayment = async () => {
      try {
        // 1. 결제 승인 및 취소(환불) 요청
        await confirmPayment({
          paymentKey,
          orderId,
          amount: Number(amount),
        });

        setStatus("결제가 승인되었으며, 즉시 환불 처리되었습니다! 🎉");

        // ====================================================
        // 💡 2. 장바구니 비우기 (리다이렉트 후 토큰 복구 로직 추가)
        // ====================================================
        try {
          let token = getAccessToken();
          
          // 토스에서 돌아오느라 메모리 토큰이 날아갔다면 먼저 복구 시도
          if (!token) {
            try {
              token = await silentRefresh();
            } catch (e) {
              // 비회원이면 에러가 나므로 가볍게 무시
            }
          }
          
          // 이제 정확한 신분을 알았으니 분기 처리
          if (token) {
            // 🟢 [회원] 백엔드 DB에 있는 장바구니 내역 삭제
            const items = await fetchCartItems();
            await Promise.all(items.map((item: any) => removeCartItem(item.cartItemId)));
          } else {
            // 🟡 [비회원] 로컬 스토리지에 담아둔 장바구니 내역 삭제
            localStorage.removeItem("guestCart");
          }
          
          // 헤더의 장바구니 뱃지 숫자(0)를 실시간으로 업데이트
          window.dispatchEvent(new Event("cartUpdated"));
        } catch (clearError) {
          console.error("장바구니 비우기 실패:", clearError);
        }
        
        // 3. 3초 뒤에 쇼핑 페이지로 돌려보내기
        setTimeout(() => {
          router.push("/shop"); 
        }, 3000);

      } catch (error: any) {
        setStatus("결제 승인 과정에서 오류가 발생했습니다.");
        console.error("결제 실패 사유:", error.message);
      }
    };

    processPayment();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="bg-white p-10 shadow-lg border border-black/10 text-center">
        <h1 className="text-[14px] font-bold tracking-widest text-black mb-4">PAYMENT STATUS</h1>
        <p className="text-[16px] text-gray-700">{status}</p>
      </div>
    </div>
  );
}