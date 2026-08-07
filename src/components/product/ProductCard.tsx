"use client";

import Icon from "../common/Icon";

export interface Product {
  id: number | string;
  name: string;
  price: string;
  originalPrice?: string;
  image: string;
  badge?: string;
}

export default function ProductCard({ product, onAddCart }: { product: Product; onAddCart?: (product: Product) => void }) {
  return (
    <article className="min-w-0">
      <a href={`/product/${product.id}`} className="group relative block aspect-[1/1.22] overflow-hidden bg-[#f1efec] no-underline">
        {product.badge && <span className="absolute left-[13px] top-[13px] z-[2] bg-white px-2 py-1.5 text-[8px] tracking-[0.06em]">{product.badge}</span>}
        <img src={product.image} alt={product.name} className="block h-full w-full object-cover transition-transform duration-[550ms] ease-out group-hover:scale-[1.025]" />
        <button className="absolute bottom-[11px] right-[11px] z-[2] grid h-[35px] w-[35px] place-items-center rounded-full bg-white/95" aria-label={`${product.name} 장바구니 담기`} onClick={(e) => { e.preventDefault(); onAddCart?.(product); }}>
          <Icon name="bag" size={17} />
        </button>
      </a>
      <div className="pt-[13px]">
        <a href={`/product/${product.id}`} className="block text-[12px] leading-[1.45] text-[#111] no-underline">{product.name}</a>
        <div className="mt-1.5 flex items-baseline gap-2">
          <strong className="text-[12px] font-medium">{product.price}</strong>
          {product.originalPrice && <del className="text-[11px] text-[#aaa]">{product.originalPrice}</del>}
        </div>
      </div>
    </article>
  );
}
