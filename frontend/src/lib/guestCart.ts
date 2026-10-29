export const MAX_CART_QUANTITY = 99;

export type GuestLine = {
  cartItemId: number;
  productId: number;
  productName: string;
  price: number;
  thumbnailUrl?: string | null;
  quantity: number;
  colorId?: number | null;
  colorName?: string | null;
};

export type GuestLineInput = {
  productId: number;
  productName: string;
  price: number;
  thumbnailUrl?: string | null;
  quantity: number;
  colorId?: number | null;
  colorName?: string | null;
};

export function lineKey(productId: number, colorId?: number | null): string {
  return `${productId}:${colorId ?? ""}`;
}

export function clampQuantity(quantity: number): number {
  if (!Number.isInteger(quantity)) {
    throw new Error("수량은 1개 이상 99개 이하여야 합니다.");
  }
  if (quantity < 1) {
    return 1;
  }
  if (quantity > MAX_CART_QUANTITY) {
    return MAX_CART_QUANTITY;
  }
  return quantity;
}

function finitePrice(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function recoverGuestCart(value: unknown): GuestLine[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const recovered: GuestLine[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") {
      continue;
    }
    const item = entry as Partial<GuestLine>;
    const productId = Number(item.productId);
    const price = finitePrice(item.price);
    if (!Number.isInteger(productId) || productId <= 0 || typeof item.productName !== "string" || item.productName.length === 0 || price === null) {
      continue;
    }
    const rawQuantity = Number(item.quantity);
    const quantity = Number.isInteger(rawQuantity) ? clampQuantity(rawQuantity) : 1;
    const colorId = item.colorId == null ? null : Number(item.colorId);
    recovered.push({
      cartItemId: Number(item.cartItemId) || productId,
      productId,
      productName: item.productName,
      price,
      thumbnailUrl: item.thumbnailUrl || "",
      quantity,
      colorId: Number.isInteger(colorId) && colorId! > 0 ? colorId : null,
      colorName: typeof item.colorName === "string" ? item.colorName : null,
    });
  }
  return recovered;
}

export function addGuestLine(cart: GuestLine[], input: GuestLineInput, now = Date.now()): GuestLine[] {
  const quantity = input.quantity;
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_CART_QUANTITY) {
    throw new Error("수량은 1개 이상 99개 이하여야 합니다.");
  }
  const key = lineKey(input.productId, input.colorId);
  const next = cart.map((item) => ({ ...item }));
  const index = next.findIndex((item) => lineKey(item.productId, item.colorId) === key);
  if (index > -1) {
    const combined = next[index].quantity + quantity;
    if (combined > MAX_CART_QUANTITY) {
      throw new Error("수량은 99개 이하여야 합니다.");
    }
    next[index].quantity = combined;
    return next;
  }
  next.push({
    cartItemId: now,
    productId: input.productId,
    productName: input.productName,
    price: input.price,
    thumbnailUrl: input.thumbnailUrl,
    quantity,
    colorId: input.colorId ?? null,
    colorName: input.colorName ?? null,
  });
  return next;
}
