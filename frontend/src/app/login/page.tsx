"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "../../lib/api"; // 경로 확인

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter(); // 💡 라우터 사용

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      // 로그인 성공 시 setAccessToken이 호출되고, Header가 바뀜
      await loginUser({ email, password }); 
      alert("로그인되었습니다.");
      
      // 💡 화면 새로고침 없이 메인 페이지로 부드럽게 이동 (메모리 토큰 안전 유지)
      router.push("/"); 
      
    } catch (error: any) {
      setErrorMsg(error.message || "로그인에 실패했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-74px)] items-center justify-center bg-[#f9f9f9] px-5 py-20">
      <div className="w-full max-w-[400px] bg-white p-10 shadow-sm border border-black/10">
        <h1 className="mb-8 text-center text-[24px] font-normal tracking-[-0.025em]">LOG-IN</h1>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div>
            <label test-id="email-label" className="mb-2 block text-[11px] tracking-[0.08em] text-[#555]">EMAIL</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 w-full border border-black/20 px-4 text-[13px] outline-none focus:border-black"
              required 
            />
          </div>
          
          <div>
            <label className="mb-2 block text-[11px] tracking-[0.08em] text-[#555]">PASSWORD</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 w-full border border-black/20 px-4 text-[13px] outline-none focus:border-black"
              required 
            />
          </div>

          {/* 에러 메시지 출력 영역 */}
          {errorMsg && (
            <p className="text-[12px] text-red-500">{errorMsg}</p>
          )}

          <button 
            type="submit" 
            className="mt-4 h-12 w-full bg-black text-[12px] tracking-[0.1em] text-white transition hover:bg-[#333]"
          >
            SIGN IN
          </button>
        </form>

        <div className="mt-8 flex justify-center gap-4 text-[11px] tracking-[0.08em] text-[#777]">
          <a href="/signup" className="hover:text-black">JOIN US</a>
          <span className="text-[#ccc]">|</span>
          <a href="/find-password" className="hover:text-black">FIND PASSWORD</a>
        </div>
      </div>
    </main>
  );
}