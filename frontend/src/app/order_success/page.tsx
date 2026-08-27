"use client";

import Link from "next/link";
import Header from "../../components/header/Header";
import Footer from "../../components/layout/Footer";
import { useEffect, useState } from "react";

export default function OrderSuccessPage() {
  const [orderNumber, setOrderNumber] = useState("");

  useEffect(() => {
    // 실감나는 가짜 주문번호 생성 (예: ORD-1698234912)
    setOrderNumber(`ORD-${Math.floor(Math.random() * 1000000000)}`);
  }, []);

  return (
    <>
      <Header />
      <main className="flex min-h-[calc(100vh-74px)] flex-col items-center justify-center bg-[#f9f9f9] px-5 py-20">
        <div className="max-w-[600px] bg-white p-16 text-center shadow-sm border border-black/10 max-sm:p-8">
          
          <h1 className="mb-4 text-[28px] font-normal tracking-[-0.035em]">
            THANK YOU
          </h1>
          <p className="text-[12px] tracking-[0.1em] text-[#777]">
            성공적으로 주문이 완료되었습니다.
          </p>

          <div className="my-10 border-y border-black/10 py-6 text-[13px]">
            <p className="mb-2 text-[#555]">ORDER NUMBER</p>
            <p className="text-[18px] font-bold tracking-[0.05em] text-black">
              {orderNumber}
            </p>
          </div>

          <p className="mb-10 text-[12px] leading-relaxed text-[#777]">
            주문 내역 및 배송 상태는 <br className="hidden max-sm:block" />
            마이페이지에서 확인하실 수 있습니다.
          </p>

          <div className="flex justify-center gap-4 max-sm:flex-col">
            <Link 
              href="/shop" 
              className="border border-black bg-black px-8 py-4 text-[11px] tracking-[0.1em] text-white transition hover:bg-[#333]"
            >
              CONTINUE SHOPPING
            </Link>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}