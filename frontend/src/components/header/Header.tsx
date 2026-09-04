"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "../../store/useAuthStore";
import { useCartStore } from "../../store/useCartStore";
import {
  getAccessToken,
  isAccessTokenValid,
  isAdminFromToken,
  logoutUser,
  removeAccessToken,
  silentRefresh,
} from "../../lib/api";

export default function Header() {
  const pathname = usePathname();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const {
    isLoggedIn,
    isAdmin,
    setAuthState,
    clearAuthState,
  } = useAuthStore();

  const { cartCount, refreshCartCount } = useCartStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        let token = getAccessToken();

        if (!isAccessTokenValid(token)) {
          token = await silentRefresh();
        }

        if (isAccessTokenValid(token)) {
          setAuthState(true, isAdminFromToken(token));
        } else {
          clearAuthState();
        }
      } catch (error) {
        clearAuthState();
      } finally {
        setIsAuthChecking(false);
      }
    };

    initializeAuth();
  }, [setAuthState, clearAuthState]);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  useEffect(() => {
    refreshCartCount();
  }, [isLoggedIn, refreshCartCount]);

  useEffect(() => {
    const updateLoginState = () => {
      const token = getAccessToken();

      if (isAccessTokenValid(token)) {
        setAuthState(true, isAdminFromToken(token));
      } else {
        clearAuthState();
      }
    };

    window.addEventListener("authStateChanged", updateLoginState);

    return () => {
      window.removeEventListener("authStateChanged", updateLoginState);
    };
  }, [setAuthState, clearAuthState]);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("로그아웃 API 호출 실패", error);
      removeAccessToken();
    } finally {
      clearAuthState();

      let redirectPath = pathname;
      const privateRoutes = ["/admin", "/my", "/checkout"];
      const isPrivateRoute = privateRoutes.some((route) =>
        pathname.startsWith(route)
      );

      if (isPrivateRoute) {
        redirectPath = "/";
      } else if (pathname.startsWith("/shop/")) {
        redirectPath = "/shop";
      }

      window.location.href = redirectPath;
    }
  };

  const isLoadingUI = !mounted || isAuthChecking;

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white border-b border-black/10">
        <div className="mx-auto flex h-[74px] max-w-[1200px] items-center justify-between px-5">
          <Link href="/" className="text-[18px] font-bold tracking-widest">
            PORTFOLIO
          </Link>

          <nav className="flex items-center gap-6 max-md:hidden text-[12px] tracking-[0.1em]">
            <Link href="/shop" className="hover:text-gray-500">
              SHOP
            </Link>

            {isLoadingUI ? (
              <div className="w-[120px] h-[16px] animate-pulse bg-gray-100 rounded-sm"></div>
            ) : (
              <>
                {isLoggedIn ? (
                  <button
                    onClick={handleLogout}
                    className="hover:text-gray-500"
                  >
                    LOGOUT
                  </button>
                ) : (
                  <Link href="/login" className="hover:text-gray-500">
                    LOGIN
                  </Link>
                )}
              </>
            )}

            <Link href="/cart" className="hover:text-gray-500">
              CART ({mounted ? cartCount : 0})
            </Link>
          </nav>

          <div className="flex items-center gap-4 md:hidden">
            <Link
              href="/cart"
              className="text-[12px] tracking-[0.1em]"
            >
              CART ({mounted ? cartCount : 0})
            </Link>

            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-1"
              aria-label="Open Menu"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  d="M3 12h18M3 6h18M3 18h18"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 md:hidden ${
          isMenuOpen
            ? "opacity-100 visible"
            : "opacity-0 invisible"
        }`}
        onClick={() => setIsMenuOpen(false)}
      />

      <aside
        className={`fixed right-0 top-0 z-50 h-full w-[250px] bg-white p-6 shadow-xl transition-transform duration-300 md:hidden flex flex-col ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-end mb-8">
          <button
            onClick={() => setIsMenuOpen(false)}
            className="p-1"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-col gap-6 text-[14px] tracking-[0.1em]">
          <Link
            href="/shop"
            className="border-b border-gray-100 pb-2"
          >
            SHOP
          </Link>

          {isLoadingUI ? (
            <div className="mt-2 h-[150px] w-full animate-pulse bg-gray-50 rounded-sm"></div>
          ) : (
            <>
              {isAdmin && (
                <div className="bg-gray-50 p-4 rounded-sm flex flex-col gap-4 mt-2">
                  <span className="text-[11px] text-gray-500 font-bold mb-1">
                    ADMIN MENU
                  </span>

                  <Link
                    href="/admin/products"
                    className="text-blue-600"
                  >
                    PRODUCT MGT
                  </Link>

                  <Link
                    href="/admin/orders"
                    className="text-blue-600"
                  >
                    ORDER MGT
                  </Link>
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
                  <Link
                    href="/login"
                    className="border border-black py-3 w-full text-center hover:bg-black hover:text-white transition"
                  >
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