"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { create } from 'zustand';
import { getAccessToken, removeAccessToken } from "../../lib/api"; // 기존 사용하시던 API 임포트

interface AuthState {
  isLoggedIn: boolean;
  setIsLoggedIn: (status: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  setIsLoggedIn: (status: boolean) => set({ isLoggedIn: status }),
}));

export default function Header() {
  const pathname = usePathname();
  
  // 💡 사이드바 열림/닫힘 상태 관리
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // 기존 상태들 (예시 - 실제 프로젝트 환경에 맞게 수정해서 사용하세요)
  const { isLoggedIn, setIsLoggedIn } = useAuthStore();
  const [isAdmin, setIsAdmin] = useState(false); 
  const [cartCount, setCartCount] = useState(0);

  // 메뉴 이동 시 모바일 사이드바 자동 닫기
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // 스크롤 방지 (사이드바 열렸을 때 뒤에 화면이 스크롤 안 되게)
  useEffect(() => {
    if (isMenuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
  }, [isMenuOpen]);

  useEffect(() => {
    // 로그인 상태를 체크하는 함수
    const updateLoginState = () => {
      setIsLoggedIn(!!getAccessToken());
    };

    // 1. 페이지가 렌더링되거나 이동(pathname 변경)할 때 1차 체크
    updateLoginState();

    // 2. 커스텀 이벤트(authStateChanged) 리스너 등록
    // API 통신 중 토큰이 갱신되거나 삭제되면 즉각 updateLoginState가 실행됩니다.
    window.addEventListener("authStateChanged", updateLoginState);

    // 컴포넌트가 언마운트될 때 리스너 청소
    return () => {
      window.removeEventListener("authStateChanged", updateLoginState);
    };
  }, [pathname]);

  const handleLogout = async () => {
    try {
      // (선택) 백엔드 로그아웃 API가 있다면 호출
      await fetch("/api/users/logout", { method: "POST" });
    } catch (error) {
      console.error("로그아웃 API 호출 실패", error);
    } finally {
      // 1. 프론트엔드 토큰 삭제 및 상태 변경
      removeAccessToken(); 
      setIsLoggedIn(false);
      
      // 2. 로그아웃 후 이동할 경로(Target URL) 계산
      let redirectPath = pathname; // 기본값: 현재 머물고 있는 위치 그대로

      // 로그인이 반드시 필요한 접근 제한 경로들 (필요에 따라 추가하세요)
      const privateRoutes = ["/admin", "/my", "/checkout"]; 
      const isPrivateRoute = privateRoutes.some((route) => pathname.startsWith(route));

      if (isPrivateRoute) {
        // 3-1. 권한이 필요한 페이지(어드민 등)에 있었다면 메인(/)으로 쫓아냄
        redirectPath = "/";
      } else if (pathname.startsWith("/shop/")) {
        // 3-2. /shop/ 상세페이지 내부에 있었다면 /shop 메인으로 이동
        redirectPath = "/shop";
      }

      // 4. 계산된 경로로 이동하며 강제 새로고침 (잔여 캐시 완벽 제거)
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

          {/* 2. 데스크탑 전용 GNB (모바일에서는 숨김: max-md:hidden) */}
          <nav className="flex items-center gap-6 max-md:hidden text-[12px] tracking-[0.1em]">
            <Link href="/shop" className="hover:text-gray-500">SHOP</Link>
            {/* <Link href="/about" className="hover:text-gray-500">ABOUT</Link> */}
            
            {/* 어드민 메뉴 */}
            {isAdmin && (
              <>
                <Link href="/admin/products" className="font-bold text-blue-600 hover:text-blue-400">PRODUCT_MGT</Link>
                <Link href="/admin/orders" className="font-bold text-blue-600 hover:text-blue-400">ORDER_MGT</Link>
              </>
            )}

            {isLoggedIn ? (
              <button onClick={handleLogout} className="hover:text-gray-500">LOGOUT</button> // ⭕ onClick 추가!
            ) : (
              <Link href="/login" className="hover:text-gray-500">LOGIN</Link>
            )}
            <Link href="/cart" className="hover:text-gray-500">CART ({cartCount})</Link>
          </nav>

          {/* 3. 모바일 전용 햄버거 & 장바구니 버튼 (데스크탑에서는 숨김: md:hidden) */}
          <div className="flex items-center gap-4 md:hidden">
            <Link href="/cart" className="text-[12px] tracking-[0.1em]">
              CART ({cartCount})
            </Link>
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="p-1"
              aria-label="Open Menu"
            >
              {/* 햄버거 아이콘 (SVG) */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* 4. 모바일 사이드바 (Drawers) */}
      {/* 뒷배경 어둡게 (Overlay) */}
      <div 
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 md:hidden ${
          isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={() => setIsMenuOpen(false)} // 배경 클릭 시 닫힘
      />

      {/* 사이드바 메뉴 패널 */}
      <aside 
        className={`fixed right-0 top-0 z-50 h-full w-[250px] bg-white p-6 shadow-xl transition-transform duration-300 md:hidden flex flex-col ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-end mb-8">
          <button onClick={() => setIsMenuOpen(false)} className="p-1">
            {/* 닫기(X) 아이콘 */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <nav className="flex flex-col gap-6 text-[14px] tracking-[0.1em]">
          <Link href="/shop" className="border-b border-gray-100 pb-2">SHOP</Link>
          {/* <Link href="/about" className="border-b border-gray-100 pb-2">ABOUT</Link> */}

          {/* 모바일 어드민 메뉴 (구분해서 표시) */}
          {isAdmin && (
            <div className="bg-gray-50 p-4 rounded-sm flex flex-col gap-4 mt-2">
              <span className="text-[11px] text-gray-500 font-bold mb-1">ADMIN MENU</span>
              <Link href="/admin/products" className="text-blue-600">PRODUCT MGT</Link>
              <Link href="/admin/orders" className="text-blue-600">ORDER MGT</Link>
            </div>
          )}

          <div className="mt-auto pt-10 flex flex-col gap-4">
            {isLoggedIn ? (
            <button onClick={handleLogout} className="hover:text-gray-500">
              LOGOUT
            </button>
          ) : (
            <Link href="/login" className="hover:text-gray-500">
              LOGIN
            </Link>
          )}
          </div>
        </nav>
      </aside>
    </>
  );
}