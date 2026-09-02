"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "../../store/useAuthStore";
import { useCartStore } from "../../store/useCartStore";
import { getAccessToken, removeAccessToken, silentRefresh } from "../../lib/api"; 

export default function Header() {
  const pathname = usePathname();
  
  // 💡 사이드바 열림/닫힘 상태 관리 및 마운트 상태
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Zustand 전역 상태 가져오기
  const { isLoggedIn, isAdmin, setIsLoggedIn, setIsAdmin } = useAuthStore();
  const { cartCount, refreshCartCount } = useCartStore();

  // 클라이언트 마운트 완료 처리 (Hydration 에러 방지)
  useEffect(() => {
    setMounted(true);
  }, []);

  // 메뉴 이동 시 모바일 사이드바 자동 닫기
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // 새로고침 시 로그인 상태 복구 (Silent Refresh)
  useEffect(() => {
    const initializeAuth = async () => {
      // 1. 메모리에 토큰이 있는지 확인
      if (!getAccessToken()) {
        // 2. 토큰이 없다면 백엔드 쿠키를 통해 재발급 시도
        await silentRefresh();
      }
      // 3. 로그인 상태 UI 업데이트
      setIsLoggedIn(!!getAccessToken());
    };

    initializeAuth();
  }, [setIsLoggedIn]);

  // 스크롤 방지 (사이드바 열렸을 때 뒤에 화면이 스크롤 안 되게)
  useEffect(() => {
    if (isMenuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
  }, [isMenuOpen]);

  // 장바구니 개수 초기화 및 로그인 상태 변경 시 갱신
  useEffect(() => {
    refreshCartCount();
  }, [isLoggedIn, refreshCartCount]);

  // 라우트 이동 및 커스텀 이벤트 발생 시 로그인 상태 동기화
  useEffect(() => {
    const updateLoginState = () => {
      setIsLoggedIn(!!getAccessToken());
    };

    updateLoginState();
    window.addEventListener("authStateChanged", updateLoginState);

    return () => {
      window.removeEventListener("authStateChanged", updateLoginState);
    };
  }, [pathname, setIsLoggedIn]);

  const handleLogout = async () => {
    try {
      await fetch("/api/users/logout", { method: "POST" });
    } catch (error) {
      console.error("로그아웃 API 호출 실패", error);
    } finally {
      // 1. 프론트엔드 토큰 삭제 및 전역 상태 확실하게 초기화
      removeAccessToken(); 
      setIsLoggedIn(false);
      setIsAdmin(false);
      
      // 2. 로그아웃 후 이동할 경로 계산
      let redirectPath = pathname;

      // 로그인이 반드시 필요한 접근 제한 경로들
      const privateRoutes = ["/admin", "/my", "/checkout"]; 
      const isPrivateRoute = privateRoutes.some((route) => pathname.startsWith(route));

      if (isPrivateRoute) {
        redirectPath = "/";
      } else if (pathname.startsWith("/shop/")) {
        redirectPath = "/shop";
      }

      // 3. 계산된 경로로 이동하며 강제 새로고침
      window.location.href = redirectPath;
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white border-b border-black/10">
        <div className="mx-auto flex h-[74px] max-w-[1200px] items-center justify-between px-5">
          
          {/* 1. 로고 */}
          <Link href="/" className="text-[18px] font-bold tracking-widest">
            PORTFOLIO
          </Link>

          {/* 2. 데스크탑 전용 GNB */}
          <nav className="flex items-center gap-6 max-md:hidden text-[12px] tracking-[0.1em]">
            <Link href="/shop" className="hover:text-gray-500">SHOP</Link>
            
            {/* mounted 되기 전에는 투명한 빈 공간으로 깜빡임 방지 */}
            {!mounted ? (
              <div className="w-[150px]"></div>
            ) : (
              <>
                {isAdmin && (
                  <>
                    <Link href="/admin/products" className="font-bold text-blue-600 hover:text-blue-400">PRODUCT_MGT</Link>
                    <Link href="/admin/orders" className="font-bold text-blue-600 hover:text-blue-400">ORDER_MGT</Link>
                  </>
                )}
                {isLoggedIn ? (
                  <button onClick={handleLogout} className="hover:text-gray-500">LOGOUT</button>
                ) : (
                  <Link href="/login" className="hover:text-gray-500">LOGIN</Link>
                )}
              </>
            )}
            <Link href="/cart" className="hover:text-gray-500">
              CART ({mounted ? cartCount : 0})
            </Link>
          </nav>

          {/* 3. 모바일 전용 햄버거 & 장바구니 버튼 */}
          <div className="flex items-center gap-4 md:hidden">
            <Link href="/cart" className="text-[12px] tracking-[0.1em]">
              CART ({mounted ? cartCount : 0})
            </Link>
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="p-1"
              aria-label="Open Menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* 4. 모바일 사이드바 (Drawers) */}
      <div 
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 md:hidden ${
          isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={() => setIsMenuOpen(false)}
      />

      <aside 
        className={`fixed right-0 top-0 z-50 h-full w-[250px] bg-white p-6 shadow-xl transition-transform duration-300 md:hidden flex flex-col ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-end mb-8">
          <button onClick={() => setIsMenuOpen(false)} className="p-1">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        
        <nav className="flex flex-col gap-6 text-[14px] tracking-[0.1em]">
          {/* 정적 메뉴는 마운트 여부 상관없이 항상 표시 */}
          <Link href="/shop" className="border-b border-gray-100 pb-2">SHOP</Link>

          {!mounted ? (
            // 마운트 전 모바일 동적 영역 스켈레톤 처리
            <div className="mt-2 h-[150px] w-full animate-pulse bg-gray-50 rounded-sm"></div>
          ) : (
            <>
              {/* 모바일 어드민 메뉴 */}
              {isAdmin && (
                <div className="bg-gray-50 p-4 rounded-sm flex flex-col gap-4 mt-2">
                  <span className="text-[11px] text-gray-500 font-bold mb-1">ADMIN MENU</span>
                  <Link href="/admin/products" className="text-blue-600">PRODUCT MGT</Link>
                  <Link href="/admin/orders" className="text-blue-600">ORDER MGT</Link>
                </div>
              )}

              {/* 로그인/로그아웃 버튼 */}
              <div className="mt-auto pt-10 flex flex-col gap-4">
                {isLoggedIn ? (
                  <button 
                    onClick={handleLogout} 
                    className="border border-black py-3 w-full hover:bg-black hover:text-white transition"
                  >
                    LOGOUT
                  </button>
                ) : (
                  <Link href="/login" className="border border-black py-3 w-full text-center hover:bg-black hover:text-white transition">
                    LOGIN
                  </Link>
                )}
              </div>
            </>
          )}
        </nav>
      </aside>
    </>
  );
}