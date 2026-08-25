import Button from "../common/Button";
import ProductGrid from "../product/ProductGrid";
import { ProductListResponse } from "../../lib/api"; // 경로를 맞춰주세요

export default function ProductSection({ 
  title, 
  products 
}: { 
  title: string; 
  products: ProductListResponse[] 
}) {
  return (
    <section className="px-7 pt-[110px] max-sm:px-[14px] max-sm:pt-[75px]">
      <div className="mb-[30px] flex items-end justify-between max-sm:mb-5">
        <h2 className="m-0 text-[clamp(23px,2.2vw,31px)] font-normal tracking-[-0.04em]">{title}</h2>
        <a href="/shop" className="no-underline"><Button variant="text" icon="arrow">VIEW MORE</Button></a>
      </div>
      <ProductGrid products={products} />
    </section>
  );
}