"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { getAccessToken, silentRefresh, logoutUser } from "../../lib/api"; 

interface CustomJwtPayload {
  sub: string;
  role: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();

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

  const handleLogout = async () => {
    await logoutUser();
    alert("로그아웃 되었습니다.");
    router.push("/");
  };

  const isActive = (path: string) => pathname.startsWith(path);

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
      <header className="fixed top-0 z-50 flex w-full items-center bg-[#111] px-4 py-3 text-white md:px-7 md:py-4">
        
        {/* 1. 로고 영역: 줄바꿈 방지(whitespace-nowrap) 및 모바일 폰트 축소 */}
        <h2 className="shrink-0 whitespace-nowrap text-[12px] font-bold tracking-tighter md:text-[14px]">
          ADMIN CONSOLE
        </h2>
        
        {/* 2. 네비게이션 & 액션 래퍼: 좁은 화면에서 가로 스와이프 허용, 미관을 위해 스크롤바는 숨김 처리 */}
        <div className="ml-4 flex flex-1 items-center gap-5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:ml-8 md:gap-8">
          
          <nav className="flex shrink-0 items-center gap-4 text-[9px] tracking-[0.14em] text-[#888] md:gap-6 md:text-[10px]">
            <Link href="/admin/resume" className={`transition hover:text-white ${isActive("/admin/resume") ? "text-white font-bold" : ""}`}>
              RESUME
            </Link>
            <Link href="/admin/projects" className={`transition hover:text-white ${isActive("/admin/projects") ? "text-white font-bold" : ""}`}>
              PROJECTS
            </Link>
            <Link href="/admin/shop" className={`transition hover:text-white ${isActive("/admin/shop") ? "text-white font-bold" : ""}`}>
              SHOP
            </Link>
          </nav>

          {/* 3. 우측 액션 버튼: ml-auto로 우측 끝 정렬 유지, 글자 겹침(줄바꿈) 원천 차단 */}
          <div className="ml-auto flex shrink-0 items-center gap-4 text-[9px] tracking-[0.14em] md:gap-6 md:text-[10px]">
            <Link href="/" className="whitespace-nowrap text-[#888] transition hover:text-white">
              VIEW SITE ↗
            </Link>
            <button onClick={handleLogout} className="whitespace-nowrap border border-white/30 px-3 py-1.5 transition hover:bg-white hover:text-black md:px-4 md:py-2">
              LOG-OUT
            </button>
          </div>
          
        </div>
      </header>

      {/* 모바일 환경의 줄어든 헤더 높이에 맞게 본문 시작 여백(padding-top) 미세 조정 */}
      <main className="pt-[50px] md:pt-[60px]"> 
        {children}
      </main>
    </div>
  );
}