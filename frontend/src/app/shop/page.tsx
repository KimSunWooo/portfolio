"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Header from "../../components/header/Header";
import ShopHeader from "../../components/admin/shop/ShopHeader";
import ProductGrid from "../../components/product/ProductGrid";
import Footer from "../../components/layout/Footer";
import { fetchProducts, type ProductListResponse } from "../../lib/api";
import {
  DEFAULT_SHOP_FILTER, filterShopProducts, parseShopQuery, shopOptions, shopQuery,
  type ShopFilter, type ShopSort,
} from "../../lib/shopFilters.mts";

export default function ShopPage() {
  const [catalog, setCatalog] = useState<ProductListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reload, setReload] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [filter, setFilter] = useState<ShopFilter>(DEFAULT_SHOP_FILTER);

  useEffect(() => {
    let active = true;
    const readLocation = () => {
      if (!active) return;
      const next = parseShopQuery(window.location.search);
      setFilter(next);
      setKeyword(next.search);
      setSelectedCategory(next.category);
    };
    window.addEventListener("popstate", readLocation);
    void Promise.resolve().then(readLocation);
    return () => { active = false; window.removeEventListener("popstate", readLocation); };
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      await Promise.resolve();
      if (!active) return;
      setLoading(true);
      setLoadError("");
      try {
        const data = await fetchProducts();
        if (!Array.isArray(data)) throw new Error("Invalid product response");
        if (active) setCatalog(data);
      } catch {
        if (active) setLoadError("상품을 불러오지 못했습니다. 다시 시도해 주세요.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [reload]);

  const options = useMemo(() => shopOptions(catalog), [catalog]);
  const products = useMemo(() => filterShopProducts(catalog, filter), [catalog, filter]);

  const apply = (next: ShopFilter) => {
    const query = shopQuery(next);
    if (query !== window.location.search) {
      window.history.pushState(null, "", `${window.location.pathname}${query}${window.location.hash}`);
    }
    setFilter(next);
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    apply({ ...filter, category: selectedCategory, search: keyword.trim() });
  };

  return (
    <>
      <Header />
      <main>
        <ShopHeader
          category={filter.category}
          count={products.length}
          options={options}
          onSelect={(category) => { setSelectedCategory(category); apply({ ...filter, category }); }}
        />

        <section className="mx-auto max-w-7xl px-7 pt-[45px] max-sm:px-[14px] max-sm:pt-[30px]">
          <form onSubmit={submitSearch} className="mb-10 flex w-full flex-col justify-end gap-2 sm:flex-row">
            <label className="sr-only" htmlFor="shop-category">카테고리</label>
            <select
              id="shop-category"
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="min-w-[140px] cursor-pointer border border-gray-300 bg-white px-4 py-2 text-sm focus:border-black focus:outline-none"
            >
              {!options.some((item) => item.value === selectedCategory) && (
                <option value={selectedCategory}>선택한 분류</option>
              )}
              {options.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <div className="flex w-full sm:w-auto">
              <label className="sr-only" htmlFor="shop-search">상품명</label>
              <input
                id="shop-search"
                type="search"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="상품명을 입력하세요"
                className="w-full border border-r-0 border-gray-300 px-4 py-2 text-sm focus:border-black focus:outline-none sm:w-[250px]"
              />
              <button type="submit" className="whitespace-nowrap bg-black px-6 py-2 text-sm font-medium text-white hover:bg-gray-800">검색</button>
            </div>
            <label className="sr-only" htmlFor="shop-sort">정렬</label>
            <select
              id="shop-sort"
              value={filter.sort}
              onChange={(event) => apply({ ...filter, sort: event.target.value as ShopSort })}
              className="min-w-[140px] border border-gray-300 bg-white px-4 py-2 text-sm"
            >
              <option value="default">등록순</option>
              <option value="price-asc">가격 낮은순</option>
              <option value="price-desc">가격 높은순</option>
              <option value="name">상품명순</option>
            </select>
          </form>

          {loading ? (
            <p className="py-20 text-center text-sm text-gray-600">상품을 불러오는 중입니다...</p>
          ) : loadError ? (
            <div role="alert" className="py-20 text-center text-sm text-red-700">
              <p>{loadError}</p>
              <button type="button" onClick={() => setReload((value) => value + 1)} className="mt-3 underline">다시 시도</button>
            </div>
          ) : products.length === 0 ? (
            <p className="py-20 text-center text-sm text-gray-600">조건에 맞는 상품이 없습니다.</p>
          ) : <ProductGrid products={products} />}
        </section>
      </main>
      <Footer />
    </>
  );
}
