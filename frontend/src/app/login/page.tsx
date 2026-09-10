"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // Link 컴포넌트 추가
import {
  getAccessToken,
  isAccessTokenValid,
  isAdminFromToken,
  loginUser,
  syncLocalCartToServer,
} from "../../lib/api";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      await loginUser({ email, password });

      const token = getAccessToken();

      if (!isAccessTokenValid(token)) {
        useAuthStore.getState().clearAuthState();
        throw new Error("유효한 Access Token을 전달받지 못했습니다.");
      }

      const isAdmin = isAdminFromToken(token);
      useAuthStore.getState().setAuthState(true, isAdmin);

      try {
        const guestCartData = localStorage.getItem("guestCart");

        if (guestCartData) {
          const guestItems = JSON.parse(guestCartData);

          if (guestItems && guestItems.length > 0) {
            await syncLocalCartToServer(guestItems);
            localStorage.removeItem("guestCart");
          }
        }

        await useCartStore.getState().refreshCartCount();
      } catch (syncError) {
        console.error("장바구니 동기화 에러 (로그인은 유지됨):", syncError);
      }

      router.push("/admin/projects");
    } catch (error: any) {
      setErrorMessage(error.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f9f9f9] px-4">
      <div className="w-full max-w-[400px] bg-white p-8 shadow-xl">
        <h2 className="mb-6 text-center text-[18px] font-bold tracking-tighter">
          LOGIN
        </h2>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold tracking-widest text-[#777]">
              EMAIL
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full border border-black/20 px-3 text-sm outline-none transition focus:border-black"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[10px] font-bold tracking-widest text-[#777]">
              PASSWORD
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 w-full border border-black/20 px-3 text-sm outline-none transition focus:border-black"
              required
            />
          </label>

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
          
          {/* 비밀번호 찾기 및 회원가입 링크 영역 추가 */}
          <div className="mt-4 flex items-center justify-center gap-4 text-[11px] tracking-widest text-[#777]">
            <Link 
              href="/forgot-password" 
              className="transition hover:text-black hover:underline"
            >
              FORGOT PASSWORD?
            </Link>
            <span className="text-[#ddd]">|</span>
            <Link 
              href="/signup" 
              className="transition hover:text-black hover:underline"
            >
              SIGN UP
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}