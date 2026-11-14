"use client";

export default function ShopHeader({
  category,
  count,
  options,
  onSelect,
}: {
  category: string;
  count: number;
  options: { value: string; label: string }[];
  onSelect: (value: string) => void;
}) {
  const label = options.find((option) => option.value === category)?.label ?? "SHOP";
  return (
    <section className="border-b border-[#ddd] px-7 pb-7 pt-[132px] max-sm:px-[14px] max-sm:pb-[22px] max-sm:pt-[105px]">
      <div className="text-xs tracking-[0.08em] text-[#666]">HOME / SHOP / {label}</div>
      <div className="mt-[54px] flex items-end justify-between max-sm:mt-[38px]">
        <h1 className="m-0 text-[34px] font-normal tracking-[-0.05em] max-sm:text-[27px]">SHOP</h1>
        <span aria-live="polite" className="text-xs text-[#555]">{count} PRODUCTS</span>
      </div>
      <nav aria-label="상품 분류" className="mt-7 flex flex-wrap gap-4">
        {options.map((item) => (
          <button
            key={item.value}
            type="button"
            aria-pressed={item.value === category}
            onClick={() => onSelect(item.value)}
            className={`border-b-2 py-1 text-sm tracking-[0.05em] ${item.value === category ? "border-black text-black" : "border-transparent text-[#595959] hover:border-black/40"}`}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </section>
  );
}
