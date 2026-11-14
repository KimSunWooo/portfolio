export type ShopProduct = {
  id: number;
  name: string;
  price: number;
  category?: string | null;
  isNew?: boolean;
  isBest?: boolean;
};

export type ShopSort = "default" | "price-asc" | "price-desc" | "name";
export type ShopFilter = { category: string; search: string; sort: ShopSort };

export const SHOP_ALL = "";
export const SHOP_UNCLASSIFIED = "special:uncategorized";
export const SHOP_BEST = "special:best";
export const SHOP_NEW = "special:new";
export const DEFAULT_SHOP_FILTER: ShopFilter = { category: SHOP_ALL, search: "", sort: "default" };

export function shopOptions(products: ShopProduct[]): { value: string; label: string }[] {
  const unique = new Map<string, string>();
  for (const product of products) {
    const category = product.category?.trim();
    if (category && !unique.has(category.toLocaleLowerCase())) {
      unique.set(category.toLocaleLowerCase(), category);
    }
  }
  const options = [{ value: SHOP_ALL, label: "ALL" }];
  if (products.some((product) => product.isBest)) options.push({ value: SHOP_BEST, label: "BEST" });
  if (products.some((product) => product.isNew)) options.push({ value: SHOP_NEW, label: "NEW" });
  for (const label of [...unique.values()].sort((a, b) => a.localeCompare(b, "ko"))) {
    options.push({ value: `value:${label}`, label });
  }
  if (products.some((product) => !product.category?.trim())) {
    options.push({ value: SHOP_UNCLASSIFIED, label: "미분류" });
  }
  return options;
}

export function parseShopQuery(search: string): ShopFilter {
  const params = new URLSearchParams(search);
  const raw = params.get("category") ?? "";
  const category = raw === "best" ? SHOP_BEST : raw === "new" ? SHOP_NEW
    : raw === "uncategorized" ? SHOP_UNCLASSIFIED : raw.startsWith("value:") ? raw : SHOP_ALL;
  const rawSort = params.get("sort");
  const sort: ShopSort = rawSort === "price-asc" || rawSort === "price-desc" || rawSort === "name"
    ? rawSort : "default";
  return { category, search: params.get("q") ?? "", sort };
}

export function shopQuery(filter: ShopFilter): string {
  const params = new URLSearchParams();
  const category = filter.category === SHOP_BEST ? "best" : filter.category === SHOP_NEW ? "new"
    : filter.category === SHOP_UNCLASSIFIED ? "uncategorized" : filter.category;
  if (category) params.set("category", category);
  if (filter.search.trim()) params.set("q", filter.search.trim());
  if (filter.sort !== "default") params.set("sort", filter.sort);
  const value = params.toString();
  return value ? `?${value}` : "";
}

export function filterShopProducts<T extends ShopProduct>(products: T[], filter: ShopFilter): T[] {
  const keyword = filter.search.trim().toLocaleLowerCase();
  const category = filter.category.startsWith("value:") ? filter.category.slice(6).toLocaleLowerCase() : "";
  const result = products.filter((product) => {
    const nameMatches = !keyword || product.name.toLocaleLowerCase().includes(keyword);
    const categoryMatches = filter.category === SHOP_ALL
      || (filter.category === SHOP_BEST && product.isBest)
      || (filter.category === SHOP_NEW && product.isNew)
      || (filter.category === SHOP_UNCLASSIFIED && !product.category?.trim())
      || (Boolean(category) && product.category?.trim().toLocaleLowerCase() === category);
    return nameMatches && categoryMatches;
  });
  if (filter.sort === "price-asc") result.sort((a, b) => a.price - b.price || a.id - b.id);
  if (filter.sort === "price-desc") result.sort((a, b) => b.price - a.price || a.id - b.id);
  if (filter.sort === "name") result.sort((a, b) => a.name.localeCompare(b.name, "ko") || a.id - b.id);
  return result;
}
