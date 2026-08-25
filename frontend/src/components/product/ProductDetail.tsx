"use client";

import { useMemo, useState } from "react";
import { ProductDetailResponse, resolveAssetUrl } from "../../lib/api"; // 경로를 맞춰주세요

function formatPrice(price: number) {
  return `${price.toLocaleString("ko-KR")}원`;
}

export default function ProductDetail({ product }: { product: ProductDetailResponse }) {
  const [selectedColor, setSelectedColor] = useState(0);
  const [quantity, setQuantity] = useState(1);
  
  // 가격이 숫자 타입으로 내려오므로 계산이 훨씬 간단해졌습니다.
  const totalPrice = useMemo(() => product.price * quantity, [product.price, quantity]);

  // S3 썸네일 URL 매핑
  const mainImage = resolveAssetUrl(product.thumbnail) || "/images/no-image.png";
  
  // 뱃지 처리 (isNew, isBest 기준)
  let badge = "";
  if (product.isNew) badge = "NEW";
  else if (product.isBest) badge = "BEST";

  // 백엔드에서 받아온 이미지 목록 중 DETAIL 타입만 상세 이미지로 필터링
  const detailImages = product.images
    .filter((img) => img.imageType === "DETAIL" || !img.imageType)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((img) => resolveAssetUrl(img.imageUrl))
    .filter(Boolean) as string[];

  // 디테일 정보를 유동적으로 렌더링
  const infoMap = [
    { label: "USAGE", value: product.detail?.usageInfo },
    { label: "INGREDIENTS", value: product.detail?.ingredients },
    { label: "INFO", value: product.detail?.productInfo },
  ].filter(item => item.value);

  return (
    <main className="border-t border-black/10">
      <section className="grid min-h-[calc(100vh-74px)] grid-cols-2 max-[820px]:grid-cols-1">
        <div className="sticky top-0 h-[calc(100vh-74px)] overflow-hidden bg-[#f2f0ed] max-[820px]:static max-[820px]:h-auto">
          <img src={mainImage} alt={product.name} className="h-full w-full object-cover max-[820px]:aspect-[1/1.18] max-[820px]:h-auto" />
        </div>

        <div className="flex justify-center px-[8vw] py-[9vh] max-[1100px]:px-10 max-[820px]:px-5 max-[820px]:py-12">
          <div className="w-full max-w-[520px] self-center">
            {product.category && (
              <p className="mb-4 text-[10px] tracking-[0.18em] uppercase text-[#777]">{product.category}</p>
            )}
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-[28px] font-normal leading-[1.25] tracking-[-0.025em] max-sm:text-[24px]">{product.name}</h1>
              {badge && <span className="mt-1 border border-black px-2 py-1 text-[8px] tracking-[0.12em]">{badge}</span>}
            </div>
            
            <p className="mt-3 text-[13px] leading-6 text-[#777]">
              {product.detail?.shortDescription || "상품에 대한 간략한 설명입니다."}
            </p>

            <div className="mt-8 flex items-baseline gap-3 border-b border-black/10 pb-8">
              <strong className="text-[17px] font-medium">{formatPrice(product.price)}</strong>
              {product.originalPrice && <del className="text-[13px] text-[#aaa]">{formatPrice(product.originalPrice)}</del>}
            </div>

            {product.colors && product.colors.length > 0 && (
              <div className="border-b border-black/10 py-7">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-[11px] tracking-[0.08em]">COLOR</span>
                  <span className="text-[11px] text-[#777]">{product.colors[selectedColor]?.colorName}</span>
                </div>
                <div className="flex gap-2.5">
                  {product.colors.map((color, index) => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setSelectedColor(index)}
                      aria-label={color.colorName}
                      title={color.colorName}
                      className={`h-7 w-7 rounded-full border p-[3px] transition ${selectedColor === index ? "border-black" : "border-transparent"}`}
                    >
                      <span className="block h-full w-full rounded-full border border-black/10" style={{ backgroundColor: color.colorCode }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

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

            {product.detail?.description && (
              <p className="mt-10 text-[12px] leading-[1.9] text-[#555] whitespace-pre-wrap">{product.detail.description}</p>
            )}

            {infoMap.length > 0 && (
              <div className="mt-9 border-t border-black/10">
                {infoMap.map((info, index) => (
                  <div key={index} className="flex justify-between border-b border-black/10 py-4 text-[10px]">
                    <span className="tracking-[0.08em] text-[#888]">{info.label}</span>
                    <span>{info.value}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 grid grid-cols-3 border-y border-black/10 py-5 text-center text-[9px] tracking-[0.07em] text-[#666]">
              <span>FREE SHIPPING</span>
              <span className="border-x border-black/10">SECURE PAYMENT</span>
              <span>EASY RETURN</span>
            </div>
          </div>
        </div>
      </section>

      {product.detail?.shortDescription && (
        <section className="px-7 py-28 text-center max-sm:px-5 max-sm:py-20">
          <p className="text-[10px] tracking-[0.2em] text-[#888]">PRODUCT STORY</p>
          <h2 className="mx-auto mt-5 max-w-[760px] text-[30px] font-normal leading-[1.45] tracking-[-0.025em] max-sm:text-[23px]">
            {product.name}
          </h2>
          <p className="mx-auto mt-6 max-w-[620px] text-[12px] leading-[2] text-[#777] whitespace-pre-wrap">
            {product.detail.shortDescription}
          </p>
        </section>
      )}

      {detailImages.length > 0 && (
        <section className="mx-auto max-w-[1440px] px-7 pb-28 max-sm:px-0 max-sm:pb-16">
          <div className="mb-10 px-0 text-center max-sm:px-5">
            <p className="text-[10px] tracking-[0.2em] text-[#888]">PRODUCT DETAIL</p>
          </div>
          <div className="mx-auto flex max-w-[1100px] flex-col gap-5">
            {detailImages.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`${product.name} 상세 이미지 ${index + 1}`}
                className="h-auto w-full object-cover"
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}