import Header from "../../components/header/Header";
import ShopHeader from "../../components/shop/ShopHeader";
import ProductGrid from "../../components/product/ProductGrid";
import Footer from "../../components/layout/Footer";
import { products } from "../../data/products";

export default function ShopPage() {
  return (
    <>
      <Header />
      <main>
        <ShopHeader category="ALL" count={products.length} />
        <section className="px-7 pt-[45px] max-sm:px-[14px] max-sm:pt-[30px]">
          <ProductGrid products={products} />
        </section>
      </main>
      <Footer />
    </>
  );
}
