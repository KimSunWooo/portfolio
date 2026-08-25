"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "../../components/header/Header";
import Footer from "../../components/layout/Footer";
import { loginUser } from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // 에러 상태 관리를 위한 state 추가
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(""); // 로그인 시도 시 기존 에러 메시지 초기화
    
    try {
      const data = await loginUser({ email, password });
      
      // 토큰을 로컬 스토리지에 저장
      localStorage.setItem("accessToken", data.accessToken);
      
      // 로그인 성공 시 바로 shop으로 이동 (알림 없음)
      router.push("/shop");

    } catch (error: any) {
      // 로그인 실패 시 상태 업데이트
      setErrorMessage("이메일 또는 비밀번호를 다시 확인해 주세요.");
    }
  };

  return (
    <>
      <Header />
      <main className="flex min-h-[calc(100vh-74px)] flex-col items-center justify-center border-t border-black/10 px-5 py-20">
        <div className="w-full max-w-[400px]">
          <h1 className="mb-2 text-center text-[26px] font-normal tracking-[-0.025em]">LOGIN</h1>
          <p className="mb-10 text-center text-[12px] tracking-[0.05em] text-[#777]">
            Please enter your e-mail and password.
          </p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <input
                type="email"
                placeholder="E-MAIL"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMessage(""); // 타이핑 시작하면 에러 메시지 지우기
                }}
                // 에러 발생 시 border 색상을 빨간색으로 변경
                className={`h-12 border-b bg-transparent px-3 text-[13px] tracking-[0.05em] outline-none transition placeholder:text-[#aaa] ${
                  errorMessage ? "border-red-500" : "border-black/20 focus:border-black"
                }`}
                required
              />
            </div>
            
            <div className="flex flex-col gap-1">
              <input
                type="password"
                placeholder="PASSWORD"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage(""); // 타이핑 시작하면 에러 메시지 지우기
                }}
                className={`h-12 border-b bg-transparent px-3 text-[13px] tracking-[0.05em] outline-none transition placeholder:text-[#aaa] ${
                  errorMessage ? "border-red-500" : "border-black/20 focus:border-black"
                }`}
                required
              />
            </div>

            {/* 에러 메시지 출력 영역 */}
            {errorMessage && (
              <p className="text-[11px] text-red-500 tracking-[0.05em] px-1">
                {errorMessage}
              </p>
            )}

            <div className="mt-6 flex flex-col gap-3">
              <button 
                type="submit" 
                className="h-12 w-full bg-black text-[12px] tracking-[0.08em] text-white transition hover:bg-[#333]"
              >
                SIGN IN
              </button>
            </div>
          </form>

          <div className="mt-8 flex items-center justify-between border-t border-black/10 pt-6 text-[11px] tracking-[0.05em] text-[#777]">
            <Link href="/find-password" className="transition hover:text-black">
              FORGOT PASSWORD?
            </Link>
            <Link href="/signup" className="text-black transition hover:underline border-b border-black pb-[1px]">
              CREATE ACCOUNT
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}