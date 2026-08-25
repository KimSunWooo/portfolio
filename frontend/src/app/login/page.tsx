"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "../../components/header/Header";
import Footer from "../../components/layout/Footer";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // 백엔드 API 연동 위치
    console.log("로그인 시도:", { email, password });
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
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 border-b border-black/20 bg-transparent px-3 text-[13px] tracking-[0.05em] outline-none transition placeholder:text-[#aaa] focus:border-black"
                required
              />
            </div>
            
            <div className="flex flex-col gap-1">
              <input
                type="password"
                placeholder="PASSWORD"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 border-b border-black/20 bg-transparent px-3 text-[13px] tracking-[0.05em] outline-none transition placeholder:text-[#aaa] focus:border-black"
                required
              />
            </div>

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