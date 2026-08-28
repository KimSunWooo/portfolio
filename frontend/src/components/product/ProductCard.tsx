"use client";

import Icon from "../common/Icon";
// 💡 addCartItem 추가 import
import { ProductListResponse, resolveAssetUrl, addCartItem } from "../../lib/api";

export default function ProductCard({ 
  product 
}: { 
  product: ProductListResponse; 
}) {
  const imageUrl = resolveAssetUrl(product.thumbnail) || "/images/no-image.png";
  
  let badge = "";
  if (product.isNew) badge = "NEW";
  else if (product.isBest) badge = "BEST";

  // 💡 부모에게 의존하지 않고 카드 자체에서 직접 장바구니 담기 처리
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); // 카드 클릭 시 상세 페이지로 넘어가는 것 방지
    
    try {
      // lib/api.ts 의 분기 처리 로직 호출 (수량은 기본 1개로)
      await addCartItem(product, 1);
      
      alert("장바구니에 담겼습니다!");
      
      // 헤더의 장바구니 숫자 즉시 업데이트
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (error: any) {
      alert(error.message || "장바구니 담기에 실패했습니다.");
    }
  };

  return (
    <article className="min-w-0">
      <a href={`/product/${product.id}`} className="group relative block aspect-[1/1.22] overflow-hidden bg-[#f1efec] no-underline">
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
        <button 
          className="absolute bottom-[11px] right-[11px] z-[2] grid h-[35px] w-[35px] place-items-center rounded-full bg-white/95 transition hover:bg-black hover:text-white" 
          aria-label={`${product.name} 장바구니 담기`} 
          onClick={handleAddToCart} // 💡 직접 만든 핸들러 연결
        >
          <Icon name="bag" size={17} />
        </button>
      </a>
      <div className="pt-[13px]">
        <a href={`/product/${product.id}`} className="block text-[12px] leading-[1.45] text-[#111] no-underline">
          {product.name}
        </a>
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