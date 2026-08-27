"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/header/Header";
import Footer from "../../components/layout/Footer";
import { getAccessToken, silentRefresh } from "../../lib/api";
import Link from "next/link";

type TabType = "PROFILE" | "ORDERS" | "SETTINGS";

export default function MyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("PROFILE");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      let token = getAccessToken();
      if (!token) {
        try {
          token = await silentRefresh();
        } catch (error) {
          alert("로그인이 필요한 페이지입니다.");
          router.replace("/login");
          return;
        }
      }

      // JWT 토큰을 해독해서 유저 이메일(아이디) 추출
      if (token) {
        try {
          const base64Url = token.split(".")[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          );
          const payload = JSON.parse(jsonPayload);
          // 토큰의 sub(주체) 또는 email 필드를 사용
          setUserEmail(payload.sub || payload.email || "Member");
        } catch (e) {
          setUserEmail("Member");
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white text-[11px] tracking-[0.2em] text-[#999]">
        LOADING MYPAGE...
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-74px)] bg-[#f9f9f9] px-5 py-20">
        <div className="mx-auto flex max-w-[1000px] items-start gap-12 max-md:flex-col">
          
          {/* 좌측 사이드바 메뉴 */}
          <aside className="w-[200px] shrink-0 max-md:w-full">
            <h1 className="mb-8 text-[20px] font-normal tracking-[-0.025em] text-black">
              MY ACCOUNT
            </h1>
            <nav className="flex flex-col gap-4 text-[12px] tracking-[0.1em] text-[#777]">
              <button 
                onClick={() => setActiveTab("PROFILE")}
                className={`text-left transition hover:text-black ${activeTab === "PROFILE" ? "font-bold text-black" : ""}`}
              >
                PROFILE
              </button>
              <button 
                onClick={() => setActiveTab("ORDERS")}
                className={`text-left transition hover:text-black ${activeTab === "ORDERS" ? "font-bold text-black" : ""}`}
              >
                ORDER HISTORY
              </button>
              <button 
                onClick={() => setActiveTab("SETTINGS")}
                className={`text-left transition hover:text-black ${activeTab === "SETTINGS" ? "font-bold text-black" : ""}`}
              >
                SETTINGS
              </button>
            </nav>
          </aside>

          {/* 우측 콘텐츠 영역 */}
          <section className="flex-1 bg-white p-10 shadow-sm border border-black/10 max-sm:p-6 w-full">
            
            {/* 프로필 탭 */}
            {activeTab === "PROFILE" && (
              <div>
                <h2 className="mb-6 border-b border-black/10 pb-4 text-[13px] tracking-[0.1em]">
                  ACCOUNT INFORMATION
                </h2>
                <div className="space-y-6 text-[12px]">
                  <div>
                    <p className="mb-1 tracking-[0.1em] text-[#888]">EMAIL</p>
                    <p className="text-[14px] text-black">{userEmail}</p>
                  </div>
                  <div>
                    <p className="mb-1 tracking-[0.1em] text-[#888]">MEMBERSHIP</p>
                    <p className="text-[14px] text-black">일반 회원 (Standard)</p>
                  </div>
                </div>
              </div>
            )}

            {/* 주문 내역 탭 */}
            {activeTab === "ORDERS" && (
              <div>
                <h2 className="mb-6 border-b border-black/10 pb-4 text-[13px] tracking-[0.1em]">
                  ORDER HISTORY
                </h2>
                {/* 현재는 주문 백엔드가 없으므로 빈 상태(Empty State) 디자인을 보여줍니다 */}
                <div className="py-20 text-center">
                  <p className="mb-6 text-[12px] tracking-[0.05em] text-[#777]">
                    아직 주문하신 내역이 없습니다.
                  </p>
                  <Link 
                    href="/shop" 
                    className="inline-block border border-black px-6 py-3 text-[10px] tracking-[0.1em] transition hover:bg-black hover:text-white"
                  >
                    GO SHOPPING ↗
                  </Link>
                </div>
              </div>
            )}

            {/* 설정 탭 */}
            {activeTab === "SETTINGS" && (
              <div>
                <h2 className="mb-6 border-b border-black/10 pb-4 text-[13px] tracking-[0.1em]">
                  ACCOUNT SETTINGS
                </h2>
                <form className="max-w-[400px] space-y-4" onSubmit={(e) => { e.preventDefault(); alert("준비 중인 기능입니다."); }}>
                  <div>
                    <label className="mb-2 block text-[10px] tracking-[0.1em] text-[#777]">CURRENT PASSWORD</label>
                    <input type="password" required className="w-full border border-black/10 px-4 py-3 text-[12px] outline-none transition focus:border-black" />
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] tracking-[0.1em] text-[#777]">NEW PASSWORD</label>
                    <input type="password" required className="w-full border border-black/10 px-4 py-3 text-[12px] outline-none transition focus:border-black" />
                  </div>
                  <button type="submit" className="mt-4 w-full bg-black py-4 text-[11px] tracking-[0.1em] text-white transition hover:bg-[#333]">
                    UPDATE PASSWORD
                  </button>
                </form>
              </div>
            )}

          </section>

        </div>
      </main>
      <Footer />
    </>
  );
}