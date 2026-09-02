"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "../../lib/api"; // 경로 확인

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter(); 
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 💡 2. 로그인 시도 전 기존 에러 메시지 초기화
    setErrorMessage(""); 

    try {
      // API 호출
      await loginUser({ email, password });
      
      // 로그인 성공 시 관리자 페이지로 이동
      router.push("/admin/projects"); 
    } catch (error: any) {
      // 💡 3. API 통신 중 에러가 발생하면 catch로 넘어옴
      // error.message에 "비밀번호가 일치하지 않습니다."가 들어있습니다.
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