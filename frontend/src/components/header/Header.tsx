"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { silentRefresh, logoutUser, getAccessToken, fetchCartCount } from "../../lib/api";

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  
  // 💡 [추가됨] 새로고침 직후 찰나의 순간 'Login' 메뉴가 깜빡이는 것을 막는 방어막
  const [isInitializing, setIsInitializing] = useState(true); 
  
  const router = useRouter();
  const pathname = usePathname();

  const isShopArea = pathname.startsWith("/shop") || 
                     pathname.startsWith("/cart") || 
                     pathname.startsWith("/mypage") || 
                     pathname.startsWith("/login");

  // JWT 디코딩 및 어드민 체크 함수 (기존 코드 완벽 유지)
  function checkAdminStatus(token: string) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
      );
      const payload = JSON.parse(jsonPayload);
      
      const roleString = String(payload.role || payload.auth || payload.roles || "");
      return roleString.includes("ADMIN");
    } catch (error) {
      return false;
    }
  }

  // 장바구니 갯수 업데이트 함수 (기존 코드 완벽 유지)
  const updateCartCount = async () => {
    if (pathname.startsWith("/admin") || !isShopArea) return; 
    try {
      const totalQuantity = await fetchCartCount();
      setCartCount(totalQuantity);
    } catch (error) {
      console.error("장바구니 뱃지 로드 실패");
    }
  };

  // 💡 [수정됨] 2개로 나뉘어 충돌하던 useEffect를 하나로 깔끔하게 통합
  useEffect(() => {
    if (pathname.startsWith("/admin")) return; 

    const initAuth = async () => {
      let token = getAccessToken();
      
      // 메모리에 토큰이 없다면 백그라운드에서 조용히 쿠키를 찔러 재발급 시도
      if (!token) {
        token = await silentRefresh();
      }

      if (token) {
        setIsLoggedIn(true);
        setIsAdmin(checkAdminStatus(token));
        if (isShopArea) updateCartCount();
      } else {
        setIsLoggedIn(false);
        setIsAdmin(false);
      }
      
      // 토큰 확인이 완전히 끝났으므로 헤더 메뉴 렌더링 허락
      setIsInitializing(false); 
    };
    
    initAuth();

    // 로그인/로그아웃 이벤트 및 장바구니 업데이트 감지
    const handleAuthChange = () => {
      const currentToken = getAccessToken();
      if (currentToken) {
        setIsLoggedIn(true);
        setIsAdmin(checkAdminStatus(currentToken));
        if (isShopArea) updateCartCount();
      } else {
        setIsLoggedIn(false);
        setIsAdmin(false);
      }
    };

    window.addEventListener("authStateChanged", handleAuthChange);
    window.addEventListener("cartUpdated", updateCartCount);

    return () => {
      window.removeEventListener("authStateChanged", handleAuthChange);
      window.removeEventListener("cartUpdated", updateCartCount);
    };
  }, [pathname, isShopArea]); 

  const handleLogout = async () => {
    await logoutUser();
    setIsLoggedIn(false);
    setIsAdmin(false);
    setCartCount(0);
    alert("로그아웃 되었습니다.");
    router.push("/");
  };

  // 어드민 페이지에서는 기존 헤더 숨김 처리
  if (pathname.startsWith("/admin")) {
    return null; 
  }

  return (
    <header className="sticky top-0 z-50 flex h-[74px] items-center justify-between border-b border-black/10 bg-white px-7 max-sm:px-5">
      <div>
        <Link href="/" className="text-[14px] font-bold tracking-widest text-black">
          LOGO
        </Link>
      </div>

      <nav className="flex items-center gap-8 text-[11px] tracking-[0.1em]">
        <Link href="/shop" className="hover:text-gray-500">SHOP</Link>

        {isShopArea && (
          <Link href="/cart" className="hover:text-gray-500 flex items-center gap-1">
            CART 
            {cartCount > 0 && (
              <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-black px-1 text-[9px] text-white">
                {cartCount}
              </span>
            )}
          </Link>
        )}

        {/* 💡 [핵심] isInitializing이 끝날 때까지 우측 메뉴들은 투명하게 대기시켜 깜빡임을 막습니다 */}
        {!isInitializing && (
          <>
            {isLoggedIn ? (
              <>
                <Link href="/mypage" className="hover:text-gray-500">MYPAGE</Link>
                <button onClick={handleLogout} className="hover:text-gray-500">LOGOUT</button>
              </>
            ) : (
              <Link href="/login" className="hover:text-gray-500">LOGIN</Link>
            )}

            {isAdmin && (
              <Link href="/admin/resume" className="font-bold text-black hover:text-gray-500">
                ADMIN
              </Link>
            )}
          </>
        )}
      </nav>
    </header>
  );
}