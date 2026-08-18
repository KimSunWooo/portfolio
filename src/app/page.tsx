import Header from "../components/header/Header";
import Hero from "../components/home/Hero";
import ProductSection from "../components/home/ProductSection";
import Footer from "../components/layout/Footer";
import { products } from "../data/products";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <ProductSection title="BEST SELLER" products={products.slice(0, 4)} />
        <ProductSection title="NEW ARRIVALS" products={products.slice(4, 12)} />
      </main>
      <Footer />
    </>
  );
}
