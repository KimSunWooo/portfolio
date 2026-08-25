"use client";

import Icon from "../common/Icon";
import { ProductListResponse, resolveAssetUrl } from "../../lib/api";

export default function ProductCard({ 
  product, 
  onAddCart 
}: { 
  product: ProductListResponse; 
  onAddCart?: (product: ProductListResponse) => void 
}) {
  // 백엔드 에셋 경로 매핑 (null일 경우 엑스박스를 방지하기 위한 더미 이미지 경로 지정 가능)
  const imageUrl = resolveAssetUrl(product.thumbnail) || "/images/no-image.png";
  
  // 뱃지 출력 로직 (isNew가 우선이거나 isBest가 우선이도록 설정 가능)
  let badge = "";
  if (product.isNew) badge = "NEW";
  else if (product.isBest) badge = "BEST";

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
          className="absolute bottom-[11px] right-[11px] z-[2] grid h-[35px] w-[35px] place-items-center rounded-full bg-white/95" 
          aria-label={`${product.name} 장바구니 담기`} 
          onClick={(e) => { 
            e.preventDefault(); 
            onAddCart?.(product); 
          }}
        >
          <Icon name="bag" size={17} />
        </button>
      </a>
      <div className="pt-[13px]">
        <a href={`/product/${product.id}`} className="block text-[12px] leading-[1.45] text-[#111] no-underline">
          {product.name}
        </a>
        <div className="mt-1.5 flex items-baseline gap-2">
          {/* 숫자를 원화 형태로 포맷팅 */}
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