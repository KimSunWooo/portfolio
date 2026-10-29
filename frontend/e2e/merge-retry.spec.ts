import { expect, test, type Page } from "@playwright/test";
import { guestCart, newAccount, seedServerCart, type BrowserAccount } from "./support/browser-account";
import { cartRows, removeBrowserAccount, removeStaleBrowserAccounts, syncCount, verifyCatalog } from "./support/isolated-db";

async function login(page: Page, account: BrowserAccount): Promise<void> {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "EMAIL" }).fill(account.email);
  await page.getByRole("textbox", { name: "PASSWORD" }).fill(account.password);
  await page.getByRole("button", { name: "LOG IN" }).click();
}

async function readGuestCart(page: Page): Promise<Array<{ quantity: number; colorName: string | null }>> {
  return page.evaluate(() => {
    const raw = localStorage.getItem("guestCart");
    if (!raw) {
      return [];
    }
    const items = JSON.parse(raw) as Array<{ quantity: number; colorName: string | null }>;
    return items.map((item) => ({ quantity: item.quantity, colorName: item.colorName }));
  });
}

test("merge over the cap rolls back, then an adjusted retry matches the server", async ({ page }) => {
  await removeStaleBrowserAccounts();
  const catalog = await verifyCatalog();
  const account = newAccount(catalog.productId, catalog.inkColorId);
  page.on("dialog", (dialog) => dialog.accept());
  try {
    await test.step("seed server cart of two", async () => {
      await seedServerCart(account);
      expect(await cartRows(account.email)).toEqual([{ quantity: 2, colorId: null }]);
    });

    await test.step("login keeps the session and rejects the merge", async () => {
      await page.goto("/login");
      await page.evaluate((items) => localStorage.setItem("guestCart", JSON.stringify(items)), guestCart(account));
      const dialog = page.waitForEvent("dialog");
      await page.getByRole("textbox", { name: "EMAIL" }).fill(account.email);
      await page.getByRole("textbox", { name: "PASSWORD" }).fill(account.password);
      await page.getByRole("button", { name: "LOG IN" }).click();
      expect((await dialog).message()).toContain("로그인은 되었습니다");
      await expect(page.getByRole("button", { name: "LOGOUT" })).toBeVisible();
      expect(await readGuestCart(page)).toEqual([
        { quantity: 98, colorName: null },
        { quantity: 1, colorName: "Ink" },
      ]);
      await expect(page.getByRole("link", { name: /CART\s*\(\s*101\s*\)/ })).toBeVisible();
      expect(await cartRows(account.email)).toEqual([{ quantity: 2, colorId: null }]);
      expect(await syncCount(account.email)).toBe(0);
    });

    await test.step("adjust the local line and merge once", async () => {
      await page.goto("/cart");
      await expect(page.getByText("아직 서버에 합치지 못한 장바구니")).toBeVisible();
      await page.getByRole("button", { name: "Verify Shade 미병합 수량 줄이기" }).first().click();
      await expect(page.getByText("색상 없음 · 수량 97")).toBeVisible();
      await expect(page.getByRole("link", { name: /CART\s*\(\s*100\s*\)/ })).toBeVisible();
      await page.getByRole("button", { name: "다시 합치기" }).click();
      await expect(page.getByText("브라우저의 장바구니를 서버에 합쳤습니다.")).toBeVisible();
      await expect(page.getByText("아직 서버에 합치지 못한 장바구니")).toHaveCount(0);
      expect(await readGuestCart(page)).toEqual([]);
      expect(await cartRows(account.email)).toEqual([
        { quantity: 99, colorId: null },
        { quantity: 1, colorId: account.inkColorId },
      ]);
      expect(await syncCount(account.email)).toBe(1);
      await expect(page.getByRole("link", { name: /CART\s*\(\s*100\s*\)/ })).toBeVisible();
    });

    await test.step("reload, logout, and login keep the merged cart", async () => {
      await page.reload();
      await expect(page.getByText("99")).toBeVisible();
      await expect(page.getByText("Ink ·")).toBeVisible();
      expect(await cartRows(account.email)).toEqual([
        { quantity: 99, colorId: null },
        { quantity: 1, colorId: account.inkColorId },
      ]);
      await page.getByRole("button", { name: "LOGOUT" }).click();
      await expect(page.getByRole("link", { name: "LOGIN" })).toBeVisible();
      await login(page, account);
      await expect(page.getByRole("button", { name: "LOGOUT" })).toBeVisible();
      await page.goto("/cart");
      await expect(page.getByText("아직 서버에 합치지 못한 장바구니")).toHaveCount(0);
      expect(await cartRows(account.email)).toEqual([
        { quantity: 99, colorId: null },
        { quantity: 1, colorId: account.inkColorId },
      ]);
      expect(await syncCount(account.email)).toBe(1);
    });
  } finally {
    await removeBrowserAccount(account.email);
  }
});
