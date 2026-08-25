import { notFound } from "next/navigation";
import Header from "../../../components/header/Header";
import Footer from "../../../components/layout/Footer";
import ProductDetail from "../../../components/product/ProductDetail";
import ProductSection from "../../../components/home/ProductSection";
import { fetchProduct, fetchProducts, ProductListResponse } from "../../../lib/api";

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
    // 1. 실제 백엔드 API에서 데이터 호출
    product = await fetchProduct(id);
  } catch (error) {
    console.error(`[ProductDetail Error] 상품 ID ${id} 로드 실패:`, error);
    notFound();
  }

  // 2. 추천 상품 로직 (타입 에러 해결 및 백엔드 필터링 적용)
  // 명시적으로 타입을 지정해 줍니다 (Error 1 해결)
  let recommendations: ProductListResponse[] = []; 
  
  try {
    // 상품에 카테고리가 있다면, 백엔드 API에 카테고리를 파라미터로 넘겨서 호출합니다 (Error 2 해결)
    const categoryParam = product.category ? product.category : undefined;
    const relatedProducts = await fetchProducts(categoryParam);
    
    // 현재 보고 있는 상품은 추천 목록에서 제외하고 최대 4개까지 자릅니다.
    recommendations = relatedProducts
      .filter((item) => String(item.id) !== id)
      .slice(0, 4);

    // 같은 카테고리 상품이 4개 미만일 경우, 전체 상품을 불러와서 부족한 개수만큼 채웁니다.
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