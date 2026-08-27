"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { silentRefresh, logoutUser, getAccessToken, fetchCartItems } from "../../lib/api"; // 💡 fetchCartItems 추가

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cartCount, setCartCount] = useState(0); // 💡 장바구니 개수 상태 추가
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // 💡 장바구니 개수를 서버에서 불러와 업데이트하는 함수
  const updateCartCount = async () => {
    if (!getAccessToken()) {
      setCartCount(0);
      return;
    }
    try {
      const items = await fetchCartItems();
      // 모든 상품의 수량을 합산 (종류별로 원하면 items.length 사용)
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(totalQuantity);
    } catch (error) {
      console.error("장바구니 뱃지 로드 실패");
    }
  };

  useEffect(() => {
    const restoreAuth = async () => {
      let token = getAccessToken();
      if (!token) {
        try {
          token = await silentRefresh();
        } catch (error) {
          setIsLoggedIn(false);
          setIsAdmin(false);
          return;
        }
      }
      if (token) {
        setIsLoggedIn(true);
        setIsAdmin(checkAdminStatus(token)); // 💡 토큰에서 관리자 권한 추출 후 세팅
        updateCartCount();
      }
    };
    restoreAuth();
  }, []);

  useEffect(() => {
    const restoreAuth = async () => {
      let token = getAccessToken();
      if (!token) {
        try {
          token = await silentRefresh();
        } catch (error) {
          setIsLoggedIn(false);
          return;
        }
      }
      if (token) {
        setIsLoggedIn(true);
        updateCartCount(); // 💡 로그인 복구 성공 시 장바구니 개수도 불러옴
      }
    };
    restoreAuth();
  }, []);

  // 💡 커스텀 이벤트 리스너 등록 (누군가 "cartUpdated"를 외치면 개수 다시 불러오기)
  useEffect(() => {
    window.addEventListener("cartUpdated", updateCartCount);
    return () => window.removeEventListener("cartUpdated", updateCartCount);
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setIsLoggedIn(false);
    setCartCount(0); // 💡 로그아웃 시 뱃지 초기화
    setIsAdmin(false);
    alert("로그아웃 되었습니다.");
    router.push("/");
  };

  if (pathname.startsWith("/admin")) {
    return null; 
  }

  const checkAdminStatus = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    const payload = JSON.parse(jsonPayload);
    
    // Spring Security의 권한 클레임(role, auth 등)에서 ADMIN 문자열이 포함되어 있는지 확인 (예: USER_ADMIN, ROLE_ADMIN)
    const roleString = String(payload.role || payload.auth || payload.roles || "");
    return roleString.includes("ADMIN");
  } catch (error) {
    return false;
  }
};

  return (
    <header className="sticky top-0 z-50 flex h-[74px] items-center justify-between border-b border-black/10 bg-white px-7 max-sm:px-5">
      {/* ... 기존 로고 영역 ... */}

      <nav className="flex items-center gap-8 text-[11px] tracking-[0.1em]">
        <Link href="/shop" className="hover:text-gray-500">SHOP</Link>
        <Link href="/project" className="hover:text-gray-500">PORTFOLIO</Link>
        <Link href="/cart" className="hover:text-gray-500 flex items-center gap-1">
          CART 
          {/* 💡 개수가 0보다 클 때만 숫자 뱃지 표시 */}
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
          <Link href="/admin/products" className="font-bold text-black hover:text-gray-500">
            ADMIN
          </Link>
        )}
      </nav>
    </header>
  );
}