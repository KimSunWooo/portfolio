"use client";

import Header from "../../components/header/Header";
import ShopHeader from "../../components/admin/shop/ShopHeader";
import ProductGrid from "../../components/product/ProductGrid";
import Footer from "../../components/layout/Footer";
import { useEffect, useState } from "react";
import { fetchProducts, ProductListResponse } from "../../lib/api";

export default function ShopPage() {
  const [products, setProducts] = useState<ProductListResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 💡 빌드 시점이 아니라, 사용자가 페이지에 접속했을 때 비로소 백엔드에 요청합니다.
    const loadData = async () => {
      try {
        const data = await fetchProducts();
        setProducts(data);
      } catch (error) {
        console.error("데이터를 불러오는데 실패했습니다.", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (loading) return <div>상품을 불러오는 중입니다...</div>;

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