import Header from "../../components/header/Header";
import ShopHeader from "../../components/admin/shop/ShopHeader";
import ProductGrid from "../../components/product/ProductGrid";
import Footer from "../../components/layout/Footer";
import { fetchProducts } from "../../lib/api";

export default async function ShopPage() {
  // 백엔드 API를 호출하여 실제 상품 데이터를 가져옵니다.
  const products = await fetchProducts();

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