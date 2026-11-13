import { expect, test, type Page } from "@playwright/test";
import { newAccount, seedServerCart, type BrowserAccount } from "./support/browser-account";
import {
  cartRows,
  demoOrderRows,
  paymentHistoryCount,
  productStock,
  removeBrowserAccount,
  removeStaleBrowserAccounts,
  setProductStock,
  verifyCatalog,
} from "./support/isolated-db";

async function login(page: Page, account: BrowserAccount): Promise<void> {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "EMAIL" }).fill(account.email);
  await page.getByRole("textbox", { name: "PASSWORD" }).fill(account.password);
  await page.getByRole("button", { name: "LOG IN" }).click();
  await expect(page.getByRole("button", { name: "LOGOUT" })).toBeVisible();
}

test("demo order confirm shows in history, cancel restores stock exactly once", async ({ page }) => {
  await removeStaleBrowserAccounts();
  const catalog = await verifyCatalog();
  const account = newAccount(catalog.productId, catalog.inkColorId);
  const initialStock = await productStock(catalog.productId);
  page.on("dialog", (dialog) => dialog.accept());
  try {
    await test.step("seed a server cart of two and log in", async () => {
      await seedServerCart(account);
      expect(await cartRows(account.email)).toEqual([{ quantity: 2, colorId: null }]);
      await login(page, account);
    });

    await test.step("confirm the demo order from the cart", async () => {
      await page.goto("/cart");
      await page.getByRole("button", { name: "데모 주문 확정" }).click();
      await expect(page).toHaveURL(/\/mypage\?tab=ORDERS/);
      await expect(page.getByText("데모 주문이 확정되었습니다.")).toBeVisible();
    });

    await test.step("history lists the CONFIRMED order and the DB matches", async () => {
      await expect(page.getByText("CONFIRMED", { exact: true })).toBeVisible();
      await expect(page.getByText("Verify Shade × 2 · PAID")).toBeVisible();
      await expect(page.getByText("₩24,000")).toBeVisible();
      expect(await cartRows(account.email)).toEqual([]);
      expect(await productStock(catalog.productId)).toBe(initialStock - 2);
      expect(await demoOrderRows(account.email)).toEqual([
        { recordSource: "DEMO", lineStatus: "PAID", quantity: 2, stockRestored: 0 },
      ]);
      // DEMO orders never write the 100원 test payment history.
      expect(await paymentHistoryCount(account.email)).toBe(0);
    });

    await test.step("history survives a reload", async () => {
      await page.reload();
      await expect(page.getByText("CONFIRMED", { exact: true })).toBeVisible();
      await expect(page.getByText("Verify Shade × 2 · PAID")).toBeVisible();
    });

    await test.step("cancel restores stock and marks the line CANCELLED", async () => {
      await page.getByRole("button", { name: "취소", exact: true }).click();
      await expect(page.getByText("CANCELLED", { exact: true })).toBeVisible();
      await expect(page.getByText("Verify Shade × 2 · CANCELLED")).toBeVisible();
      await expect(page.getByRole("button", { name: "취소", exact: true })).toHaveCount(0);
      expect(await productStock(catalog.productId)).toBe(initialStock);
      expect(await demoOrderRows(account.email)).toEqual([
        { recordSource: "DEMO", lineStatus: "CANCELLED", quantity: 2, stockRestored: 1 },
      ]);
    });

    await test.step("a reload keeps CANCELLED and stock is not restored twice", async () => {
      await page.reload();
      await expect(page.getByText("CANCELLED", { exact: true })).toBeVisible();
      expect(await productStock(catalog.productId)).toBe(initialStock);
      expect(await paymentHistoryCount(account.email)).toBe(0);
    });
  } finally {
    await removeBrowserAccount(account.email);
    // A failed run must not leave the shared verify product short of stock for the next spec.
    await setProductStock(catalog.productId, initialStock);
  }
});
