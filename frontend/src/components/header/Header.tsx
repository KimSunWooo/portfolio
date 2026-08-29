"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { silentRefresh, logoutUser, getAccessToken, fetchCartItems } from "../../lib/api";

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [isInitialized, setIsInitialized] = useState(false); 
  
  const router = useRouter();
  const pathname = usePathname();

  // 💡 메인(포트폴리오)이 아닌 쇼핑몰 관련 페이지인지 확인하는 로직!
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
    // 💡 관리자 페이지거나, 쇼핑몰 영역이 아니면 아예 장바구니 API를 찌르지 않고 함수 종료!
    if (pathname.startsWith("/admin") || !isShopArea) return; 

    try {
      const items = await fetchCartItems();
      const totalQuantity = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
      setCartCount(totalQuantity);
    } catch (error) {
      console.error("장바구니 뱃지 로드 실패");
    }
  };

  useEffect(() => {
    if (pathname.startsWith("/admin") || isInitialized) return; 

    const restoreAuth = async () => {
      let token = getAccessToken();
      if (!token) {
        try {
          token = await silentRefresh();
        } catch (error) {
          setIsLoggedIn(false);
          setIsAdmin(false);
          setIsInitialized(true);
          return;
        }
      }
      
      if (token) {
        setIsLoggedIn(true);
        setIsAdmin(checkAdminStatus(token)); 
        updateCartCount(); 
      }
      setIsInitialized(true); 
    };
    
    restoreAuth();
  }, [pathname, isInitialized]); 

  useEffect(() => {
    if (isInitialized && isShopArea) {
      updateCartCount();
    }
  }, [isShopArea, isInitialized]);

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
    setIsInitialized(false); 
    
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
        {/* 💡 포트폴리오(메인)에서도 언제든 쇼핑몰로 진입할 수 있도록 SHOP 링크는 항상 노출 */}
        <Link href="/shop" className="hover:text-gray-500">SHOP</Link>

        {/* 💡 isShopArea가 true일 때(쇼핑몰 관련 페이지일 때)만 아래 메뉴들을 렌더링! */}
        {isShopArea && (
          <>
            <Link href="/cart" className="hover:text-gray-500 flex items-center gap-1">
              CART 
              {cartCount > 0 && (
                <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-black px-1 text-[9px] text-white">
                  {cartCount}
                </span>
              )}
            </Link>
            
            {isLoggedIn ? (
              <>
                <Link href="/mypage" className="hover:text-gray-500">MYPAGE</Link>
                <button onClick={handleLogout} className="hover:text-gray-500">LOGOUT</button>
              </>
            ) : (
              <Link href="/login" className="hover:text-gray-500">LOGIN</Link>
            )}
          </>
        )}

        {/* ADMIN 버튼은 어드민 권한이 있을 때만 항상 표시 (포트폴리오에서도 어드민 관리 필요하므로) */}
        {isAdmin && (
          <Link href="/admin/resume" className="font-bold text-black hover:text-gray-500">
            ADMIN
          </Link>
        )}
      </nav>
    </header>
  );
}