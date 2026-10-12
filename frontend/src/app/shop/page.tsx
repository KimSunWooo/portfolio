"use client";

import Header from "../../components/header/Header";
import ShopHeader from "../../components/admin/shop/ShopHeader";
import ProductGrid from "../../components/product/ProductGrid";
import Footer from "../../components/layout/Footer";
import { useEffect, useRef, useState, SyntheticEvent } from "react";
import { fetchProducts, ProductListResponse } from "../../lib/api";

export default function ShopPage() {
  const [products, setProducts] = useState<ProductListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const requestSeq = useRef(0);

  // 1. 사용자 입력 상태 (타이핑/선택 중인 값)
  const [keyword, setKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // 2. 실제 검색에 적용될 상태 (엔터/버튼 클릭 시 업데이트)
  const [appliedFilter, setAppliedFilter] = useState({
    category: "ALL",
    search: "",
  });

  useEffect(() => {
    const current = ++requestSeq.current;
    const loadData = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const data = await fetchProducts({
          category: appliedFilter.category,
          search: appliedFilter.search.trim(),
        });
        if (current !== requestSeq.current) return;
        setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        if (current !== requestSeq.current) return;
        console.error("데이터를 불러오는데 실패했습니다.", error);
        setProducts([]);
        setLoadError("상품을 불러오지 못했습니다.");
      } finally {
        if (current === requestSeq.current) setLoading(false);
      }
    };
    
    loadData();
  }, [appliedFilter]);

  const handleSearch = (e: SyntheticEvent ) => {
    e.preventDefault();
    setAppliedFilter({
      category: selectedCategory,
      search: keyword,
    });
  };

  return (
    <>
      <Header />
      <main>
        {/* ShopHeader에 적용된 카테고리를 전달하여 타이틀 연동 */}
        <ShopHeader category={appliedFilter.category} count={products.length} />
        
        <section className="px-7 pt-[45px] max-sm:px-[14px] max-sm:pt-[30px] max-w-7xl mx-auto">
          
          {/* 미니멀 디자인의 복합 검색 바 */}
          <form 
            onSubmit={handleSearch} 
            className="flex flex-col sm:flex-row gap-2 mb-10 w-full justify-end"
          >
            {/* 카테고리 셀렉트박스 */}
            <label className="sr-only" htmlFor="shop-category">카테고리</label>
            <select
              id="shop-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:border-black bg-white cursor-pointer min-w-[140px]"
            >
              <option value="ALL">전체 카테고리</option>
              <option value="LIP">LIP</option>
              <option value="EYE">EYE</option>
              <option value="BASE">BASE</option>
              <option value="NAIL">NAIL</option>
              {/* 본인 DB에 맞는 카테고리로 수정하세요 */}
            </select>

            {/* 검색어 입력 및 버튼 그룹 */}
            <div className="flex w-full sm:w-auto">
              <label className="sr-only" htmlFor="shop-search">상품명</label>
              <input
                id="shop-search"
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="상품명을 입력하세요"
                className="w-full sm:w-[250px] border border-gray-300 border-r-0 px-4 py-2 text-sm focus:outline-none focus:border-black transition-colors"
              />
              <button 
                type="submit" 
                className="bg-black text-white px-6 py-2 text-sm font-medium hover:bg-gray-800 transition-colors whitespace-nowrap"
              >
                검색
              </button>
            </div>
          </form>

          {/* 상품 목록 영역 */}
          {loading ? (
            <div className="py-20 text-center text-gray-500 text-sm">상품을 불러오는 중입니다...</div>
          ) : loadError ? (
            <div className="py-20 text-center text-sm text-red-600">{loadError}</div>
          ) : products.length === 0 ? (
            <div className="py-20 text-center text-gray-500 text-sm">조건에 맞는 상품이 없습니다.</div>
          ) : (
            <ProductGrid products={products} />
          )}
          
        </section>
      </main>
      <Footer />
    </>
  );
}