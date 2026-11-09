import { expect, test } from "@playwright/test";

test.describe("home first viewport and payment fail", () => {
  test("home shows featured project links and shop demo label", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const nav = page.getByRole("navigation", { name: "대표 프로젝트 바로가기" });
    await expect(nav.getByRole("link", { name: "대표 프로젝트" })).toHaveAttribute("href", "#projects");
    await expect(nav.getByRole("link", { name: "트러블슈팅" })).toHaveAttribute("href", "#troubleshooting");
    await expect(nav.getByRole("link", { name: "GitHub" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "쇼핑몰 데모" })).toHaveAttribute("href", "/shop");

    await nav.getByRole("link", { name: "트러블슈팅" }).click();
    await expect(page.locator("#troubleshooting")).toBeVisible();
    await expect(page.getByRole("link", { name: "장바구니 정합성 ↗" })).toBeVisible();
    await expect(page.getByRole("link", { name: "인증 갱신과 로그아웃 충돌 ↗" })).toBeVisible();
    await expect(page.getByRole("link", { name: "배포 복구 ↗" })).toBeVisible();
  });

  test("payment fail page explains cancel and returns to cart without confirming payment", async ({ page }) => {
    let confirmCalled = false;
    await page.route("**/api/payments/confirm", async (route) => {
      confirmCalled = true;
      await route.fulfill({ status: 500, body: "should not be called" });
    });
    await page.route("**/api/cart/**", async (route) => {
      await route.fulfill({ status: 500, body: "should not mutate cart" });
    });

    await page.goto("/payment/fail?code=PAY_PROCESS_CANCELED&message=사용자가%20결제를%20취소했습니다.&orderId=order-demo-1");
    await expect(page.getByRole("heading", { name: "결제를 취소했습니다." })).toBeVisible();
    await expect(page.getByText("주문 번호: order-demo-1")).toBeVisible();
    await expect(page.getByRole("link", { name: "장바구니로 돌아가기" })).toHaveAttribute("href", "/cart");
    expect(confirmCalled).toBe(false);

    await page.goto("/payment/fail");
    await expect(page.getByRole("heading", { name: "결제에 실패했습니다." })).toBeVisible();
    await expect(page.getByRole("link", { name: "장바구니로 돌아가기" })).toBeVisible();
  });
});
