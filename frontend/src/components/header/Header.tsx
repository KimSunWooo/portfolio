"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { silentRefresh, logoutUser, getAccessToken, fetchCartItems } from "../../lib/api";

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // 💡 페이지 이동 시마다 API가 중복 호출되는 것을 막기 위한 상태
  const [isInitialized, setIsInitialized] = useState(false); 
  
  const router = useRouter();
  const pathname = usePathname();

  // 관리자 권한 체크 함수
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

  // 장바구니 개수 업데이트
  const updateCartCount = async () => {
    // 💡 Admin 페이지에서는 장바구니 API 호출 스킵
    if (pathname.startsWith("/admin")) return; 

    if (!getAccessToken()) {
      setCartCount(0);
      return;
    }
    try {
      const items = await fetchCartItems();
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(totalQuantity);
    } catch (error) {
      console.error("장바구니 뱃지 로드 실패");
    }
  };

  // 💡 중복 작성되었던 useEffect를 하나로 통합 및 최적화
  useEffect(() => {
    // Admin 페이지이거나, 이미 유저 정보를 한 번 불러왔다면 스킵
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
      setIsInitialized(true); // 💡 한 번 세팅 완료 처리
    };
    
    restoreAuth();
  }, [pathname, isInitialized]); // pathname이 바뀔 때마다 체크하되 isInitialized로 중복 방지

  // 커스텀 이벤트 리스너 등록
  useEffect(() => {
    // 💡 Admin 페이지에서는 리스너 등록 안 함
    if (pathname.startsWith("/admin")) return; 

    window.addEventListener("cartUpdated", updateCartCount);
    return () => window.removeEventListener("cartUpdated", updateCartCount);
  }, [pathname]);

  const handleLogout = async () => {
    await logoutUser();
    setIsLoggedIn(false);
    setCartCount(0);
    setIsAdmin(false);
    setIsInitialized(false); // 로그아웃 시 초기화 상태도 리셋
    alert("로그아웃 되었습니다.");
    router.push("/");
  };

  // 💡 화면 렌더링 방지 (이 코드는 반드시 Hook들보다 아래에 있어야 에러가 나지 않습니다)
  if (pathname.startsWith("/admin")) {
    return null; 
  }

  return (
    <header className="sticky top-0 z-50 flex h-[74px] items-center justify-between border-b border-black/10 bg-white px-7 max-sm:px-5">
      {/* 💡 기존 로고 영역 (수정 시 본인 코드에 맞게 복구하세요) */}
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