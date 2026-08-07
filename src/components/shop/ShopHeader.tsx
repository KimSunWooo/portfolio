import Button from "../common/Button";

const categories = ["ALL", "BEST", "NEW", "BASE", "CHEEK", "EYE", "LIP", "FRAGRANCE"];

export default function ShopHeader({ category = "ALL", count = 61 }: { category?: string; count?: number }) {
  return (
    <section className="border-b border-[#ddd] px-7 pb-7 pt-[132px] max-sm:px-[14px] max-sm:pb-[22px] max-sm:pt-[105px]">
      <div className="text-[9px] tracking-[0.08em] text-[#999]">HOME / SHOP / {category}</div>
      <div className="mt-[54px] flex items-end justify-between max-sm:mt-[38px]">
        <h1 className="m-0 text-[34px] font-normal tracking-[-0.05em] max-sm:text-[27px]">SHOP</h1>
        <span className="text-[9px] text-[#777]">{count} PRODUCTS</span>
      </div>
      <nav className="mt-7 flex flex-wrap gap-[17px]">
        {categories.map((item) => <a key={item} href="#" className={`text-[10px] tracking-[0.05em] no-underline ${item === category ? "text-[#111]" : "text-[#999]"}`}>{item}</a>)}
      </nav>
      <div className="mt-[25px] flex justify-end gap-[25px]">
        <Button variant="text">FILTER</Button>
        <Button variant="text">SORT BY</Button>
      </div>
    </section>
  );
}
