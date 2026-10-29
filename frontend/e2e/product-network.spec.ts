import { expect, test } from "@playwright/test";
import {
  findVerifyBackend,
  startVerifyBackend,
  stopVerifyBackend,
  waitForProductApi,
} from "./support/verify-process";

test("a server-side product fetch connection failure is not a missing product", async ({ page }) => {
  test.setTimeout(180_000);
  const backend = findVerifyBackend();
  let stopped = false;
  try {
    await test.step("confirm the product page reads the API on the server", async () => {
      const browserApiCalls: string[] = [];
      page.on("request", (request) => {
        if (request.url().includes("/api/products/1")) {
          browserApiCalls.push(request.url());
        }
      });
      const response = await page.goto("/product/1");
      expect(response?.ok()).toBe(true);
      expect(browserApiCalls).toEqual([]);
      await expect(page.getByRole("heading", { name: "Verify Shade" })).toBeVisible();
    });

    await test.step("stop only the verify backend and open the product page", async () => {
      stopVerifyBackend(backend);
      stopped = true;
      await waitForProductApi(false);
      await page.goto("/product/1");
      await expect(page.getByRole("heading", { name: "상품 정보를 불러오지 못했습니다." })).toBeVisible();
      await expect(page.getByRole("heading", { name: "상품을 찾을 수 없습니다." })).toHaveCount(0);
    });

    await test.step("restore the connection and retry", async () => {
      startVerifyBackend(backend);
      stopped = false;
      await waitForProductApi(true);
      await page.getByRole("button", { name: "다시 시도" }).click();
      await expect(page.getByRole("heading", { name: "Verify Shade" })).toBeVisible();
    });
  } finally {
    if (stopped) {
      startVerifyBackend(backend);
    }
    await waitForProductApi(true);
  }
});
