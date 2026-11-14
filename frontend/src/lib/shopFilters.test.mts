import { strict as assert } from "node:assert";
import { test } from "node:test";
import { DEFAULT_SHOP_FILTER, SHOP_BEST, SHOP_UNCLASSIFIED, filterShopProducts, parseShopQuery, shopOptions, shopQuery } from "./shopFilters.mts";

const products = [
  { id: 1, name: "색조 A", price: 200, category: "Cheek", isBest: true },
  { id: 2, name: "색조 B", price: 100, category: "cheek" },
  { id: 3, name: "기타", price: 300, category: null },
];

test("options use real categories and include unclassified products", () => {
  assert.deepEqual(shopOptions(products), [
    { value: "", label: "ALL" },
    { value: SHOP_BEST, label: "BEST" },
    { value: "value:Cheek", label: "Cheek" },
    { value: SHOP_UNCLASSIFIED, label: "미분류" },
  ]);
  assert.equal(filterShopProducts(products, { ...DEFAULT_SHOP_FILTER, category: SHOP_UNCLASSIFIED }).length, 1);
  assert.equal(filterShopProducts(products, { ...DEFAULT_SHOP_FILTER, category: "value:Cheek" }).length, 2);
  assert.equal(filterShopProducts(products, { ...DEFAULT_SHOP_FILTER, category: SHOP_BEST }).length, 1);
});

test("search and sort round-trip through URL parameters", () => {
  const filter = { category: "value:Cheek", search: "색조", sort: "price-asc" } as const;
  assert.deepEqual(parseShopQuery(shopQuery(filter)), filter);
  assert.deepEqual(filterShopProducts(products, filter).map((item) => item.id), [2, 1]);
  assert.deepEqual(products.map((item) => item.id), [1, 2, 3]);
  assert.deepEqual(parseShopQuery(shopQuery({ ...DEFAULT_SHOP_FILTER, category: SHOP_UNCLASSIFIED })),
    { ...DEFAULT_SHOP_FILTER, category: SHOP_UNCLASSIFIED });
});
