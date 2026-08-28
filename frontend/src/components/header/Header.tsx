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

  // 💡 장바구니 개수 업데이트 (로그인 검사 로직 제거!)
  const updateCartCount = async () => {
    if (pathname.startsWith("/admin")) return; 

    try {
      // api.ts에서 회원/비회원 여부를 알아서 판단해 배열을 리턴해줌
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
          // 💡 로그인 안 된 순수 비회원일 때도 장바구니(로컬 스토리지) 내역을 불러오도록 추가
          setIsLoggedIn(false);
          setIsAdmin(false);
          setIsInitialized(true);
          updateCartCount(); 
          return;
        }
      }
      
      if (token) {
        setIsLoggedIn(true);
        setIsAdmin(checkAdminStatus(token)); 
        updateCartCount(); // 로그인 된 회원의 장바구니(DB) 내역 불러오기
      }
      setIsInitialized(true); 
    };
    
    restoreAuth();
  }, [pathname, isInitialized]); 

  // 커스텀 이벤트 리스너 등록
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
    
    // 💡 로그아웃 시 로컬 스토리지 장바구니도 깔끔하게 비우고 싶다면 아래 주석을 해제하세요.
    // localStorage.removeItem("guestCart");
    
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
        <Link href="/project" className="hover:text-gray-500">PORTFOLIO</Link>
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
        {isAdmin && (
          <Link href="/admin/resume" className="font-bold text-black hover:text-gray-500">
            ADMIN
          </Link>
        )}
      </nav>
    </header>
  );
}