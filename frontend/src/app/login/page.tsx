"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser, syncLocalCartToServer } from "../../lib/api"; // 경로 확인
import { useCartStore } from "@/store/useCartStore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter(); 
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e: React.SyntheticEvent) => {
      e.preventDefault();
      setErrorMessage(""); 

      try {
        // 1. 로그인 API 호출 (토큰 발급 및 저장 완료)
        await loginUser({ email, password });
        
        // 2. 장바구니 동기화 (Cart Migration)
        try {
          // 기존에 사용하시던 로컬 스토리지 키 값 사용
          const guestCartData = localStorage.getItem("guestCart");

          if (guestCartData) {
            const guestItems = JSON.parse(guestCartData);
            
            if (guestItems && guestItems.length > 0) {
              // 서버로 병합 요청
              await syncLocalCartToServer(guestItems);
              
              // 병합 완료 후 로컬 스토리지 비우기
              localStorage.removeItem("guestCart"); 
            }
          }

          // 3. 병합이 끝났으니 최신 장바구니 개수(DB 기준)로 스토어 갱신
          useCartStore.getState().refreshCartCount();

        } catch (syncError) {
          console.error("장바구니 동기화 에러 (로그인은 유지됨):", syncError);
        }

        // 4. 페이지 이동
        router.push("/admin/projects"); 
        
      } catch (error: any) {
        setErrorMessage(error.message);
      }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f9f9f9] px-4">
      <div className="w-full max-w-[400px] bg-white p-8 shadow-xl">
        <h2 className="mb-6 text-center text-[18px] font-bold tracking-tighter">LOGIN</h2>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold tracking-widest text-[#777]">EMAIL</span>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full border border-black/20 px-3 text-sm outline-none transition focus:border-black"
              required
            />
          </label>
          
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold tracking-widest text-[#777]">PASSWORD</span>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 w-full border border-black/20 px-3 text-sm outline-none transition focus:border-black"
              required
            />
          </label>

          {/* 💡 4. 에러 메시지가 존재할 경우에만 빨간색 경고 문구 노출 */}
          {errorMessage && (
            <p className="text-center text-[11px] font-bold text-red-500">
              {errorMessage}
            </p>
          )}

          <button 
            type="submit"
            className="mt-4 bg-black py-3 text-[11px] font-bold tracking-widest text-white transition hover:bg-gray-800"
          >
            LOG IN
          </button>
        </form>
      </div>
    </div>
  );
}