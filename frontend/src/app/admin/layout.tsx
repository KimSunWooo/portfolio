"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  ensureAccessToken,
  logoutUser,
  isAdminFromToken,
  isDemoFromToken,
  canAccessPurchaseAnalytics,
} from "../../lib/api";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isFullAdmin, setIsFullAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const token = await ensureAccessToken();
        const fullAdmin = isAdminFromToken(token);
        const demo = isDemoFromToken(token);
        const purchasesOnly = pathname.startsWith("/admin/purchases");

        if (!token) {
          router.replace(`/login?next=${encodeURIComponent(pathname)}`);
          return;
        }

        if (fullAdmin) {
          setIsFullAdmin(true);
          setIsAuthorized(true);
          return;
        }

        if (demo && purchasesOnly && canAccessPurchaseAnalytics(token)) {
          setIsFullAdmin(false);
          setIsAuthorized(true);
          return;
        }

        if (demo) {
          router.replace("/admin/purchases");
          return;
        }

        router.replace("/");
      } catch (error) {
        console.error("비정상적인 경로이거나 인증 오류입니다.", error);
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAdminAuth();
  }, [pathname, router]);

  const handleLogout = async () => {
    const result = await logoutUser();
    if (result === "revoked") {
      alert("로그아웃되었습니다.");
    } else if (result === "local_only") {
      alert("이 브라우저의 로그인 정보는 지웠지만 서버 세션은 확인하지 못했습니다.");
    } else {
      alert("이 브라우저에서는 로그아웃했지만 서버 세션 정리가 끝나지 않았습니다. 다시 로그인해 주세요.");
    }
    router.push("/");
  };

  const isActive = (path: string) => pathname.startsWith(path);

  if (loading || !isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9f9f9]">
        <p className="text-[11px] tracking-[0.14em] text-[#777]">
          VERIFYING ADMIN ACCESS...
        </p>
      </div>
    );
  }

  return (
    <div className="admin-container min-h-screen bg-white">
      <header className="fixed top-0 z-50 flex w-full items-center bg-[#111] px-4 py-3 text-white md:px-7 md:py-4">
        <h2 className="shrink-0 whitespace-nowrap text-[12px] font-bold tracking-tighter md:text-[14px]">
          {isFullAdmin ? "ADMIN CONSOLE" : "DEMO CONSOLE"}
        </h2>

        <div className="ml-4 flex flex-1 items-center gap-5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:ml-8 md:gap-8">
          <nav className="flex shrink-0 items-center gap-4 text-[9px] tracking-[0.14em] text-[#888] md:gap-6 md:text-[10px]">
            {isFullAdmin && (
              <>
                <Link href="/admin/resume" className={`transition hover:text-white ${isActive("/admin/resume") ? "text-white font-bold" : ""}`}>
                  RESUME
                </Link>
                <Link href="/admin/projects" className={`transition hover:text-white ${isActive("/admin/projects") ? "text-white font-bold" : ""}`}>
                  PROJECTS
                </Link>
                <Link href="/admin/shop" className={`transition hover:text-white ${isActive("/admin/shop") ? "text-white font-bold" : ""}`}>
                  SHOP
                </Link>
              </>
            )}
            <Link href="/admin/purchases" className={`transition hover:text-white ${isActive("/admin/purchases") ? "text-white font-bold" : ""}`}>
              PURCHASES
            </Link>
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-4 text-[9px] tracking-[0.14em] md:gap-6 md:text-[10px]">
            <Link href="/" className="whitespace-nowrap text-[#888] transition hover:text-white">
              VIEW SITE ↗
            </Link>
            <button onClick={handleLogout} className="whitespace-nowrap border border-white/30 px-3 py-1.5 transition hover:bg-white hover:text-black md:px-4 md:py-2">
              LOG-OUT
            </button>
          </div>
        </div>
      </header>

      <main className="pt-[50px] md:pt-[60px]">
        {children}
      </main>
    </div>
  );
}
