import { notFound } from "next/navigation";
import Header from "../../../components/header/Header";
import Footer from "../../../components/layout/Footer";
import ProductDetail from "../../../components/product/ProductDetail";
import ProductSection from "../../../components/home/ProductSection";
// 💡 fetchProduct 대신 getProductById를 import 합니다.
import { getProductById, fetchProducts, type ProductListResponse } from "../../../lib/api";

export async function generateStaticParams() {
  try {
    const products = await fetchProducts();
    return products.map((product) => ({ id: String(product.id) }));
  } catch (error) {
    return [];
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let product;
  try {
    // 💡 getProductById 로 함수명 변경
    product = await getProductById(id);
  } catch (error) {
    console.error(`[ProductDetail Error] 상품 ID ${id} 로드 실패:`, error);
    notFound();
  }

  let recommendations: ProductListResponse[] = []; 
  
  try {
    const categoryParam = product.category ? product.category : undefined;
    // 이제 api.ts를 수정했으므로 에러 없이 인자를 넘길 수 있습니다.
    const relatedProducts = await fetchProducts(categoryParam);
    
    recommendations = relatedProducts
      .filter((item) => String(item.id) !== id)
      .slice(0, 4);

    if (recommendations.length < 4) {
      const allProducts = await fetchProducts();
      recommendations = allProducts
        .filter((item) => String(item.id) !== id)
        .slice(0, 4);
    }
  } catch (error) {
    console.error("추천 상품 로드 실패", error);
  }

  return (
    <>
      <Header />
      <ProductDetail product={product} />
      {recommendations.length > 0 && (
        <ProductSection title="YOU MAY ALSO LIKE" products={recommendations} />
      )}
      <Footer />
    </>
  );
}