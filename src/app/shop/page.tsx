import Header from "../../components/header/Header";
import ShopHeader from "../../components/shop/ShopHeader";
import ProductGrid from "../../components/product/ProductGrid";
import Footer from "../../components/layout/Footer";
import { Product } from "../../components/product/ProductCard";

const products: Product[] = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1,
  name: ["Soft Glow Balm", "Single Shadow", "Dewy Liquid Cheek", "Second Skin Foundation"][index % 4],
  price: ["26,100원", "10,800원", "13,300원", "25,200원"][index % 4],
  originalPrice: ["29,000원", "12,000원", "19,000원", "36,000원"][index % 4],
  image: [
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1583241800698-e8ab01830a07?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=900&q=80",
  ][index % 4],
}));

export default function ShopPage() {
  return <><Header /><main><ShopHeader category="ALL" count={products.length} /><section className="px-7 pt-[45px] max-sm:px-[14px] max-sm:pt-[30px]"><ProductGrid products={products} /></section></main><Footer /></>;
}
