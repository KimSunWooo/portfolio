import assert from "node:assert/strict";
import test from "node:test";
import { addGuestLine, recoverGuestCart } from "./guestCart.ts";

test("a stored quantity above 99 is clamped instead of dropping the line", () => {
  const recovered = recoverGuestCart([
    { productId: 7, productName: "Lip", price: 1000, quantity: 150 },
    { productId: 8, productName: "Ink", price: 2000, quantity: 0 },
  ]);
  assert.deepEqual(
    recovered.map((item) => ({ productId: item.productId, quantity: item.quantity })),
    [
      { productId: 7, quantity: 99 },
      { productId: 8, quantity: 1 },
    ],
  );
});

test("different colors of the same product stay separate and share the quantity cap", () => {
  const first = addGuestLine([], {
    productId: 7,
    productName: "Lip",
    price: 1000,
    quantity: 2,
    colorId: 1,
    colorName: "Rose",
  }, 10);
  const both = addGuestLine(first, {
    productId: 7,
    productName: "Lip",
    price: 1000,
    quantity: 1,
    colorId: 2,
    colorName: "Sand",
  }, 11);
  assert.equal(both.length, 2);
  assert.throws(
    () => addGuestLine(both, {
      productId: 7,
      productName: "Lip",
      price: 1000,
      quantity: 98,
      colorId: 1,
      colorName: "Rose",
    }),
    /99/,
  );
});
