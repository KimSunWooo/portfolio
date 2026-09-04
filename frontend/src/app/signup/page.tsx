"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "../../components/header/Header";
import Footer from "../../components/layout/Footer";
import { signupUser } from "../../lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignup = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (formData.password !== formData.passwordConfirm) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      await signupUser({
        email: formData.email,
        password: formData.password,
        name: formData.name,
      });

      alert("회원가입이 완료되었습니다. 로그인해 주세요!");
      router.push("/login");

    } catch (error: any) {
      alert(error.message || "회원가입 중 오류가 발생했습니다.");
    }
  };

  return (
    <>
      <Header />
      <main className="flex min-h-[calc(100vh-74px)] flex-col items-center justify-center border-t border-black/10 px-5 py-20">
        <div className="w-full max-w-[400px]">
          <h1 className="mb-2 text-center text-[26px] font-normal tracking-[-0.025em]">CREATE ACCOUNT</h1>
          <p className="mb-10 text-center text-[12px] tracking-[0.05em] text-[#777]">
            Join us to explore our collection.
          </p>

          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <input
                type="text"
                name="name"
                placeholder="NAME"
                value={formData.name}
                onChange={handleChange}
                className="h-12 border-b border-black/20 bg-transparent px-3 text-[13px] tracking-[0.05em] outline-none transition placeholder:text-[#aaa] focus:border-black"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <input
                type="email"
                name="email"
                placeholder="E-MAIL"
                value={formData.email}
                onChange={handleChange}
                className="h-12 border-b border-black/20 bg-transparent px-3 text-[13px] tracking-[0.05em] outline-none transition placeholder:text-[#aaa] focus:border-black"
                required
              />
            </div>
            
            <div className="flex flex-col gap-1">
              <input
                type="password"
                name="password"
                placeholder="PASSWORD"
                value={formData.password}
                onChange={handleChange}
                className="h-12 border-b border-black/20 bg-transparent px-3 text-[13px] tracking-[0.05em] outline-none transition placeholder:text-[#aaa] focus:border-black"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <input
                type="password"
                name="passwordConfirm"
                placeholder="CONFIRM PASSWORD"
                value={formData.passwordConfirm}
                onChange={handleChange}
                className="h-12 border-b border-black/20 bg-transparent px-3 text-[13px] tracking-[0.05em] outline-none transition placeholder:text-[#aaa] focus:border-black"
                required
              />
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <button 
                type="submit" 
                className="h-12 w-full bg-black text-[12px] tracking-[0.08em] text-white transition hover:bg-[#333]"
              >
                JOIN US
              </button>
            </div>
          </form>

          <div className="mt-8 text-center border-t border-black/10 pt-6 text-[11px] tracking-[0.05em] text-[#777]">
            ALREADY HAVE AN ACCOUNT?{" "}
            <Link href="/login" className="text-black transition hover:underline border-b border-black pb-[1px]">
              LOGIN
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}