"use client";

import { useMemo, useState } from "react";
import type { ProductDetail as ProductDetailType } from "../../data/products";

function priceToNumber(price: string) {
  return Number(price.replace(/[^0-9]/g, ""));
}

function formatPrice(price: number) {
  return `${price.toLocaleString("ko-KR")}원`;
}

export default function ProductDetail({ product }: { product: ProductDetailType }) {
  const [selectedColor, setSelectedColor] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const totalPrice = useMemo(() => priceToNumber(product.price) * quantity, [product.price, quantity]);

  return (
    <main className="border-t border-black/10">
      <section className="grid min-h-[calc(100vh-74px)] grid-cols-2 max-[820px]:grid-cols-1">
        <div className="sticky top-0 h-[calc(100vh-74px)] overflow-hidden bg-[#f2f0ed] max-[820px]:static max-[820px]:h-auto">
          <img src={product.image} alt={product.name} className="h-full w-full object-cover max-[820px]:aspect-[1/1.18] max-[820px]:h-auto" />
        </div>

        <div className="flex justify-center px-[8vw] py-[9vh] max-[1100px]:px-10 max-[820px]:px-5 max-[820px]:py-12">
          <div className="w-full max-w-[520px] self-center">
            <p className="mb-4 text-[10px] tracking-[0.18em] text-[#777]">{product.category}</p>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-[28px] font-normal leading-[1.25] tracking-[-0.025em] max-sm:text-[24px]">{product.name}</h1>
              {product.badge && <span className="mt-1 border border-black px-2 py-1 text-[8px] tracking-[0.12em]">{product.badge}</span>}
            </div>
            <p className="mt-3 text-[13px] leading-6 text-[#777]">{product.subtitle}</p>

            <div className="mt-8 flex items-baseline gap-3 border-b border-black/10 pb-8">
              <strong className="text-[17px] font-medium">{product.price}</strong>
              {product.originalPrice && <del className="text-[13px] text-[#aaa]">{product.originalPrice}</del>}
            </div>

            <div className="border-b border-black/10 py-7">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[11px] tracking-[0.08em]">COLOR</span>
                <span className="text-[11px] text-[#777]">{product.colors[selectedColor].name}</span>
              </div>
              <div className="flex gap-2.5">
                {product.colors.map((color, index) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setSelectedColor(index)}
                    aria-label={color.name}
                    title={color.name}
                    className={`h-7 w-7 rounded-full border p-[3px] transition ${selectedColor === index ? "border-black" : "border-transparent"}`}
                  >
                    <span className="block h-full w-full rounded-full border border-black/10" style={{ backgroundColor: color.hex }} />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-black/10 py-6">
              <span className="text-[11px] tracking-[0.08em]">QUANTITY</span>
              <div className="flex h-9 items-center border border-black/20">
                <button type="button" className="h-full w-9 text-[15px]" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="수량 줄이기">−</button>
                <span className="grid h-full min-w-9 place-items-center border-x border-black/10 text-[11px]">{quantity}</span>
                <button type="button" className="h-full w-9 text-[15px]" onClick={() => setQuantity((value) => value + 1)} aria-label="수량 늘리기">+</button>
              </div>
            </div>

            <div className="mt-7 flex items-center justify-between">
              <span className="text-[11px] tracking-[0.08em]">TOTAL</span>
              <strong className="text-[16px] font-medium">{formatPrice(totalPrice)}</strong>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-2.5">
              <button type="button" className="h-12 border border-black bg-white text-[11px] tracking-[0.08em] transition hover:bg-[#f5f5f5]">ADD TO BAG</button>
              <button type="button" className="h-12 bg-black text-[11px] tracking-[0.08em] text-white transition hover:bg-[#333]">BUY NOW</button>
            </div>

            <p className="mt-10 text-[12px] leading-[1.9] text-[#555]">{product.description}</p>

            <div className="mt-9 border-t border-black/10">
              {product.details.map((detail, index) => (
                <div key={detail} className="flex justify-between border-b border-black/10 py-4 text-[10px]">
                  <span className="tracking-[0.08em] text-[#888]">{["VOLUME", "FINISH", "ORIGIN"][index] ?? "INFO"}</span>
                  <span>{detail}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 grid grid-cols-3 border-y border-black/10 py-5 text-center text-[9px] tracking-[0.07em] text-[#666]">
              <span>FREE SHIPPING</span>
              <span className="border-x border-black/10">SECURE PAYMENT</span>
              <span>EASY RETURN</span>
            </div>
          </div>
        </div>
      </section>

      <section className="px-7 py-28 text-center max-sm:px-5 max-sm:py-20">
        <p className="text-[10px] tracking-[0.2em] text-[#888]">PRODUCT STORY</p>
        <h2 className="mx-auto mt-5 max-w-[760px] text-[30px] font-normal leading-[1.45] tracking-[-0.025em] max-sm:text-[23px]">Build your own mood, layer by layer.</h2>
        <p className="mx-auto mt-6 max-w-[620px] text-[12px] leading-[2] text-[#777]">정해진 기준보다 나만의 분위기에 집중합니다. 매일 손이 가는 편안한 텍스처와 섬세한 컬러를 통해 자연스럽고 오래 남는 무드를 제안합니다.</p>
      </section>
    </main>
  );
}
