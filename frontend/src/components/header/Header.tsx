"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { silentRefresh, logoutUser, getAccessToken, fetchCartItems, fetchCartCount } from "../../lib/api";

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();

  const isShopArea = pathname.startsWith("/shop") || 
                     pathname.startsWith("/cart") || 
                     pathname.startsWith("/mypage") || 
                     pathname.startsWith("/login");

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

  const updateCartCount = async () => {
    if (pathname.startsWith("/admin") || !isShopArea) return; 

    try {
      // 💡 무거운 fetchCartItems() 대신 가벼운 fetchCartCount() 호출
      const totalQuantity = await fetchCartCount();
      setCartCount(totalQuantity);
    } catch (error) {
      console.error("장바구니 뱃지 로드 실패");
    }
  };

  // 💡 [해결 1] 포트폴리오 메인에서는 토큰 갱신(API 호출)을 완벽 차단!
  useEffect(() => {
    if (pathname.startsWith("/admin")) return; 

    const restoreAuth = async () => {
      let token = getAccessToken();
      
      // 이미 메모리에 토큰이 있다면(로그인 상태라면) 불필요한 호출 없이 바로 UI 업데이트
      if (token) {
        setIsLoggedIn(true);
        setIsAdmin(checkAdminStatus(token));
        if (isShopArea) updateCartCount();
        return;
      }

      // 🚀 핵심 방어막: 토큰도 없는데 현재 주소가 메인("/")이라면 API 찌르지 않고 함수 종료!
      if (pathname === "/") {
        return;
      }

      // 포트폴리오 메인이 아닌 샵(/shop)이나 로그인(/login) 진입 시에만 권한 갱신 시도
      try {
        token = await silentRefresh();
        if (token) {
          setIsLoggedIn(true);
          setIsAdmin(checkAdminStatus(token)); 
          if (isShopArea) updateCartCount(); 
        }
      } catch (error) {
        setIsLoggedIn(false);
        setIsAdmin(false);
      }
    };
    
    restoreAuth();
  }, [pathname, isShopArea]); // 페이지(pathname)가 바뀔 때마다 조건 검사

  useEffect(() => {
    if (pathname.startsWith("/admin")) return; 

    window.addEventListener("cartUpdated", updateCartCount);
    return () => window.removeEventListener("cartUpdated", updateCartCount);
  }, [pathname]);

  const handleLogout = async () => {
    await logoutUser();
    setIsLoggedIn(false);
    setCartCount(0);
    setIsAdmin(false);
    
    alert("로그아웃 되었습니다.");
    router.push("/");
  };

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

        {/* 장바구니는 쇼핑몰 관련 기능이므로 쇼핑몰 영역 안에서만 노출 */}
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

        {/* 💡 [해결 2] LOGIN/LOGOUT과 MYPAGE를 isShopArea 조건문 바깥으로 구출! */}
        {isLoggedIn ? (
          <>
            <Link href="/mypage" className="hover:text-gray-500">MYPAGE</Link>
            <button onClick={handleLogout} className="hover:text-gray-500">LOGOUT</button>
          </>
        ) : (
          <Link href="/login" className="hover:text-gray-500">LOGIN</Link>
        )}

        {/* ADMIN 버튼은 어드민 권한이 있을 때 어디서든 노출 */}
        {isAdmin && (
          <Link href="/admin/resume" className="font-bold text-black hover:text-gray-500">
            ADMIN
          </Link>
        )}
      </nav>
    </header>
  );
}