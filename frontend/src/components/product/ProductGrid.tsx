import ProductCard from "./ProductCard";
import { ProductListResponse } from "../../lib/api";

export default function ProductGrid({ 
  products, 
  columns = 4 
}: { 
  products: ProductListResponse[]; 
  columns?: 2 | 3 | 4 
}) {
  const columnClass = {
    2: "grid-cols-2",
    3: "grid-cols-3 max-[900px]:grid-cols-2",
    4: "grid-cols-4 max-[900px]:grid-cols-2",
  }[columns];

  return (
    <div className={`grid ${columnClass} gap-x-3 gap-y-[42px] max-sm:gap-x-2 max-sm:gap-y-7`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}