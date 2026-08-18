import { notFound } from "next/navigation";
import Header from "../../../components/header/Header";
import Footer from "../../../components/layout/Footer";
import ProductDetail from "../../../components/product/ProductDetail";
import ProductSection from "../../../components/home/ProductSection";
import { products } from "../../../data/products";

export function generateStaticParams() {
  return products.map((product) => ({ id: String(product.id) }));
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = products.find((item) => String(item.id) === id);

  if (!product) notFound();

  const relatedProducts = products.filter((item) => item.id !== product.id && item.category === product.category).slice(0, 4);
  const recommendations = relatedProducts.length >= 4 ? relatedProducts : products.filter((item) => item.id !== product.id).slice(0, 4);

  return (
    <>
      <Header />
      <ProductDetail product={product} />
      <ProductSection title="YOU MAY ALSO LIKE" products={recommendations} />
      <Footer />
    </>
  );
}
