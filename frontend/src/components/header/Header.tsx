"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "../../store/useAuthStore";
import { useCartStore } from "../../store/useCartStore";
import { getAccessToken, removeAccessToken, silentRefresh } from "../../lib/api"; 

export default function Header() {
  const pathname = usePathname();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // 💡 1. 인증 정보 검사 중인지 확인하는 상태 추가 (초기값 true)
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  
  const { isLoggedIn, isAdmin, setIsLoggedIn, setIsAdmin } = useAuthStore();
  const { cartCount, refreshCartCount } = useCartStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // 새로고침 시 로그인 상태 복구 (Silent Refresh)
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (!getAccessToken()) {
          await silentRefresh();
        }
        setIsLoggedIn(!!getAccessToken());
      } catch (error) {
        // 리프레시 토큰도 없거나 만료된 경우
        setIsLoggedIn(false);
      } finally {
        // 💡 2. 성공하든 실패하든 검사가 끝났으므로 false로 변경
        setIsAuthChecking(false); 
      }
    };

    initializeAuth();
  }, [setIsLoggedIn]);

  useEffect(() => {
    if (isMenuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
  }, [isMenuOpen]);

  useEffect(() => {
    refreshCartCount();
  }, [isLoggedIn, refreshCartCount]);

  useEffect(() => {
    const updateLoginState = () => {
      setIsLoggedIn(!!getAccessToken());
    };

    window.addEventListener("authStateChanged", updateLoginState);
    return () => {
      window.removeEventListener("authStateChanged", updateLoginState);
    };
  }, [setIsLoggedIn]);

  const handleLogout = async () => {
    try {
      await fetch("/api/users/logout", { method: "POST" });
    } catch (error) {
      console.error("로그아웃 API 호출 실패", error);
    } finally {
      removeAccessToken(); 
      setIsLoggedIn(false);
      setIsAdmin(false);
      
      let redirectPath = pathname;
      const privateRoutes = ["/admin", "/my", "/checkout"]; 
      const isPrivateRoute = privateRoutes.some((route) => pathname.startsWith(route));

      if (isPrivateRoute) {
        redirectPath = "/";
      } else if (pathname.startsWith("/shop/")) {
        redirectPath = "/shop";
      }

      window.location.href = redirectPath;
    }
  };

  // 💡 3. 마운트 전이거나, 인증 검사 중일 때는 UI를 보류
  const isLoadingUI = !mounted || isAuthChecking;

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white border-b border-black/10">
        <div className="mx-auto flex h-[74px] max-w-[1200px] items-center justify-between px-5">
          
          <Link href="/" className="text-[18px] font-bold tracking-widest">
            PORTFOLIO
          </Link>

          <nav className="flex items-center gap-6 max-md:hidden text-[12px] tracking-[0.1em]">
            <Link href="/shop" className="hover:text-gray-500">SHOP</Link>
            
            {/* 💡 4. 인증 로딩 상태 적용 */}
            {isLoadingUI ? (
              // 데스크탑 메뉴 로딩 시 부드러운 스켈레톤 바 표시
              <div className="w-[120px] h-[16px] animate-pulse bg-gray-100 rounded-sm"></div>
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
          <Link href="/shop" className="border-b border-gray-100 pb-2">SHOP</Link>

          {/* 💡 5. 모바일 사이드바에도 로딩 상태 적용 */}
          {isLoadingUI ? (
            <div className="mt-2 h-[150px] w-full animate-pulse bg-gray-50 rounded-sm"></div>
          ) : (
            <>
              {isAdmin && (
                <div className="bg-gray-50 p-4 rounded-sm flex flex-col gap-4 mt-2">
                  <span className="text-[11px] text-gray-500 font-bold mb-1">ADMIN MENU</span>
                  <Link href="/admin/products" className="text-blue-600">PRODUCT MGT</Link>
                  <Link href="/admin/orders" className="text-blue-600">ORDER MGT</Link>
                </div>
              )}

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