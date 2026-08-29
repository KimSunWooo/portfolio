"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { getAccessToken, silentRefresh, logoutUser } from "../../lib/api"; // 💡 logoutUser 추가

interface CustomJwtPayload {
  sub: string;
  role: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname(); // 💡 현재 경로 확인용

  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        let token = getAccessToken();

        if (!token) {
          try {
            token = await silentRefresh();
          } catch (error) {
            router.replace("/login");
            return;
          }
        }

        if (!token) throw new Error("권한이 존재하지 않습니다.");
        
        const decoded = jwtDecode<CustomJwtPayload>(token);
        
        if (decoded.role === "ROLE_ADMIN" || decoded.role === "ADMIN") {
          setIsAuthorized(true);
        } else {
          alert("접근 권한이 없습니다. 관리자만 이용할 수 있습니다.");
          router.replace("/");
        }

      } catch (error) {
        console.error("비정상적인 경로이거나 인증 오류입니다.", error);
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAdminAuth();
  }, [router]);

  // 로그아웃 처리 함수
  const handleLogout = async () => {
    await logoutUser();
    alert("관리자 로그아웃 되었습니다.");
    router.push("/");
  };

  // 현재 메뉴 활성화 체크용 헬퍼 함수
  const isActive = (path: string) => pathname.startsWith(path);

  // 권한 검사가 끝나기 전 (깜빡임 방지)
  if (loading || !isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9f9f9]">
        <p className="text-[11px] tracking-[0.14em] text-[#777]">
          VERIFYING ADMIN ACCESS...
        </p>
      </div>
    );
  }

  return (
    <div className="admin-container min-h-screen bg-white">
      {/* 💡 합쳐진 Admin Header 영역 */}
      <header className="fixed top-0 z-50 flex w-full items-center justify-between bg-[#111] px-7 py-4 text-white">
        <div className="flex items-center gap-8">
          <h2 className="text-[14px] font-bold tracking-tighter">
            ADMIN CONSOLE
          </h2>
          
          <nav className="flex gap-6 text-[10px] tracking-[0.14em] text-[#888]">
            <Link 
              href="/admin/resume" 
              className={`transition hover:text-white ${isActive("/admin/resume") ? "text-white font-bold" : ""}`}
            >
              RESUME
            </Link>
            <Link 
              href="/admin/projects" 
              className={`transition hover:text-white ${isActive("/admin/projects") ? "text-white font-bold" : ""}`}
            >
              PROJECTS
            </Link>
            <Link 
              href="/admin/shop" 
              className={`transition hover:text-white ${isActive("/admin/shop") ? "text-white font-bold" : ""}`}
            >
              SHOP
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-6 text-[10px] tracking-[0.14em]">
          <Link href="/" className="text-[#888] hover:text-white transition">
            VIEW SITE ↗
          </Link>
          <button 
            onClick={handleLogout} 
            className="border border-white/30 px-4 py-2 hover:bg-white hover:text-black transition"
          >
            LOG-OUT
          </button>
        </div>
      </header>

      {/* 헤더가 고정(fixed)되어 있으므로, 본문이 가려지지 않게 상단 여백 추가 */}
      <main className="pt-[60px]"> 
        {children}
      </main>
    </div>
  );
}