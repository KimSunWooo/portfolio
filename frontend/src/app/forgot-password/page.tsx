"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
// 💡 lib/api.ts에서 방금 추가한 API 함수들을 가져옵니다.
import {
  sendPasswordResetCode,
  verifyPasswordResetCode,
  resetPassword,
} from "../../lib/api"; 

export default function ForgotPassword() {
  const router = useRouter();

  // 진행 단계: 1(이메일 입력) -> 2(인증코드 입력) -> 3(새 비밀번호 입력)
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  // 폼 상태
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  // 메시지 및 로딩 상태
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 1. 인증 코드 발송
  const handleSendCode = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      // 💡 api.ts의 함수 호출 (Base URL 적용됨)
      await sendPasswordResetCode(email);
      
      setSuccessMessage("이메일로 인증 코드가 발송되었습니다.");
      setStep(2); // 인증코드 입력 단계로 이동
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. 인증 코드 확인
  const handleVerifyCode = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      // 💡 api.ts의 함수 호출
      await verifyPasswordResetCode(email, code);

      setSuccessMessage("인증이 완료되었습니다. 새 비밀번호를 입력해주세요.");
      setStep(3); // 새 비밀번호 입력 단계로 이동
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. 비밀번호 재설정
  const handleResetPassword = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      // 💡 api.ts의 함수 호출
      await resetPassword(email, code, newPassword);

      alert("비밀번호가 성공적으로 변경되었습니다. 다시 로그인해주세요.");
      router.push("/login"); // 완료 후 로그인 페이지로 이동
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f9f9f9] px-4">
      <div className="w-full max-w-[400px] bg-white p-8 shadow-xl">
        <h2 className="mb-6 text-center text-[18px] font-bold tracking-tighter">
          FIND PASSWORD
        </h2>

        {/* Step 1: 이메일 입력 */}
        {step === 1 && (
          <form onSubmit={handleSendCode} className="flex flex-col gap-4">
            <label className="block">
              <span className="mb-1 block text-[10px] font-bold tracking-widest text-[#777]">
                EMAIL
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="가입하신 이메일을 입력해주세요"
                className="h-11 w-full border border-black/20 px-3 text-sm outline-none transition focus:border-black"
                required
              />
            </label>

            {errorMessage && <p className="text-center text-[11px] font-bold text-red-500">{errorMessage}</p>}
            
            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 bg-black py-3 text-[11px] font-bold tracking-widest text-white transition hover:bg-gray-800 disabled:bg-gray-400"
            >
              {isLoading ? "SENDING..." : "SEND CODE"}
            </button>
          </form>
        )}

        {/* Step 2: 인증 코드 입력 */}
        {step === 2 && (
          <form onSubmit={handleVerifyCode} className="flex flex-col gap-4">
            <label className="block">
              <span className="mb-1 block text-[10px] font-bold tracking-widest text-[#777]">
                AUTH CODE
              </span>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="6자리 인증코드 입력"
                className="h-11 w-full border border-black/20 px-3 text-sm outline-none transition focus:border-black text-center tracking-[0.5em]"
                maxLength={6}
                required
              />
            </label>

            {successMessage && <p className="text-center text-[11px] font-bold text-blue-500">{successMessage}</p>}
            {errorMessage && <p className="text-center text-[11px] font-bold text-red-500">{errorMessage}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 bg-black py-3 text-[11px] font-bold tracking-widest text-white transition hover:bg-gray-800 disabled:bg-gray-400"
            >
              {isLoading ? "VERIFYING..." : "VERIFY CODE"}
            </button>
          </form>
        )}

        {/* Step 3: 새 비밀번호 입력 */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
            <label className="block">
              <span className="mb-1 block text-[10px] font-bold tracking-widest text-[#777]">
                NEW PASSWORD
              </span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="새로운 비밀번호 입력"
                className="h-11 w-full border border-black/20 px-3 text-sm outline-none transition focus:border-black"
                required
              />
            </label>

            {successMessage && <p className="text-center text-[11px] font-bold text-blue-500">{successMessage}</p>}
            {errorMessage && <p className="text-center text-[11px] font-bold text-red-500">{errorMessage}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 bg-black py-3 text-[11px] font-bold tracking-widest text-white transition hover:bg-gray-800 disabled:bg-gray-400"
            >
              {isLoading ? "CHANGING..." : "RESET PASSWORD"}
            </button>
          </form>
        )}

        {/* 하단 로그인/회원가입 링크 */}
        <div className="mt-6 flex items-center justify-center gap-4 text-[11px] tracking-widest text-[#777]">
          <Link href="/login" className="transition hover:text-black hover:underline">
            BACK TO LOGIN
          </Link>
          <span className="text-[#ddd]">|</span>
          <Link href="/signup" className="transition hover:text-black hover:underline">
            SIGN UP
          </Link>
        </div>
      </div>
    </div>
  );
}