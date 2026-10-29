"use client";

import Link from "next/link";

export default function ProductLoadError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void props;
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-start justify-center gap-4 px-6">
      <h1 className="text-lg">상품 정보를 불러오지 못했습니다.</h1>
      <p className="text-sm text-[#666]">상품이 없는 상태가 아닙니다. 잠시 후 다시 시도해 주세요.</p>
      <div className="flex gap-3">
        <button type="button" onClick={() => window.location.reload()} className="border border-black px-4 py-2 text-sm">
          다시 시도
        </button>
        <Link href="/shop" className="border border-black px-4 py-2 text-sm">
          상품 목록
        </Link>
      </div>
    </main>
  );
}
