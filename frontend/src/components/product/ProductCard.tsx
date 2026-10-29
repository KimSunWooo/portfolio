"use client";

import Link from "next/link"; // 💡 a 태그 대신 Link 사용
import Icon from "../common/Icon";
import { ProductListResponse, resolveAssetUrl, addCartItem } from "../../lib/api";
import { useState } from "react";
import { useCartStore } from "../../store/useCartStore";

export default function ProductCard({ 
  product 
}: { 
  product: ProductListResponse; 
}) {
  const imageUrl = resolveAssetUrl(product.thumbnail) || "/images/no-image.png";
  
  // Zustand에서 장바구니 새로고침 함수 꺼내기
  const { refreshCartCount } = useCartStore();
  const [pending, setPending] = useState(false);
  
  let badge = "";
  if (product.isNew) badge = "NEW";
  else if (product.isBest) badge = "BEST";

  const handleAddToCart = async () => {
    if (pending) return;
    setPending(true);
    try {
      await addCartItem(product, 1);
      await refreshCartCount();
      alert("장바구니에 담겼습니다!");
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "장바구니 담기에 실패했습니다.");
    } finally {
      setPending(false);
    }
  };

  return (
    <article className="min-w-0">
      {/* 💡 a 태그 -> Link로 변경, 경로를 /product 으로 통일, prefetch 끄기 (404 방지) */}
      <div className="group relative aspect-[1/1.22] overflow-hidden bg-[#f1efec]">
        <Link href={`/product/${product.id}`} prefetch={false} className="block h-full no-underline">
          {badge && (
            <span className="absolute left-[13px] top-[13px] z-[2] bg-white px-2 py-1.5 text-[8px] tracking-[0.06em]">
              {badge}
            </span>
          )}
          <img
            src={imageUrl}
            alt={product.name}
            className="block h-full w-full object-cover transition-transform duration-[550ms] ease-out group-hover:scale-[1.025]"
          />
        </Link>
        <button
          type="button"
          className="absolute bottom-[11px] right-[11px] z-[2] grid h-[35px] w-[35px] place-items-center rounded-full bg-white/95 transition hover:bg-black hover:text-white disabled:opacity-50"
          aria-label={`${product.name} 장바구니 담기`}
          onClick={handleAddToCart}
          disabled={pending}
        >
          <Icon name="bag" size={17} />
        </button>
      </div>
      <div className="pt-[13px]">
        {/* 💡 여기도 Link로 변경 및 경로 통일 */}
        <Link href={`/product/${product.id}`} prefetch={false} className="block text-[12px] leading-[1.45] text-[#111] no-underline">
          {product.name}
        </Link>
        <div className="mt-1.5 flex items-baseline gap-2">
          <strong className="text-[12px] font-medium">
            {product.price.toLocaleString()}원
          </strong>
          {product.originalPrice && (
            <del className="text-[11px] text-[#aaa]">
              {product.originalPrice.toLocaleString()}원
            </del>
          )}
        </div>
      </div>
    </article>
  );
}