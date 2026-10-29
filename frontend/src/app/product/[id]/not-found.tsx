import Link from "next/link";
import Header from "../../../components/header/Header";

export default function ProductNotFound() {
  return (
    <>
      <Header />
      <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-start justify-center gap-4 px-6">
        <h1 className="text-lg">상품을 찾을 수 없습니다.</h1>
        <p className="text-sm text-[#666]">요청한 상품이 없거나 더 이상 판매하지 않습니다.</p>
        <Link href="/shop" className="border border-black px-4 py-2 text-sm">
          상품 목록
        </Link>
      </main>
    </>
  );
}
