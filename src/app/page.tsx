import Header from "../components/header/Header";
import Hero from "../components/home/Hero";
import ProductSection from "../components/home/ProductSection";
import Footer from "../components/layout/Footer";
import { Product } from "../components/product/ProductCard";

const products: Product[] = [
  { id: 1, name: "Soft Glow Balm", price: "26,100원", originalPrice: "29,000원", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80" },
  { id: 2, name: "Single Shadow", price: "10,800원", originalPrice: "12,000원", image: "https://images.unsplash.com/photo-1583241800698-e8ab01830a07?auto=format&fit=crop&w=900&q=80" },
  { id: 3, name: "Layer Cheek", price: "17,100원", originalPrice: "19,000원", image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=900&q=80" },
  { id: 4, name: "Dewy Lip Tint", price: "15,300원", originalPrice: "17,000원", image: "https://images.unsplash.com/photo-1591360236480-4ed861025fa1?auto=format&fit=crop&w=900&q=80" },
  { id: 5, name: "Second Skin Cushion", price: "30,600원", originalPrice: "34,000원", image: "https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=900&q=80" },
  { id: 6, name: "Mirror Dew Gloss", price: "15,300원", originalPrice: "17,000원", image: "https://images.unsplash.com/photo-1631214524020-7e18db9d9f92?auto=format&fit=crop&w=900&q=80" },
  { id: 7, name: "All Round Eye Palette", price: "18,200원", originalPrice: "26,000원", image: "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=900&q=80" },
  { id: 8, name: "Soft Matte Lip", price: "13,300원", originalPrice: "19,000원", image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=900&q=80" },
];

export default function Home() {
  return <><Header /><main><Hero /><ProductSection title="BEST SELLER" products={products.slice(0, 4)} /><ProductSection title="NEW ARRIVALS" products={products} /></main><Footer /></>;
}
