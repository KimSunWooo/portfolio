import { expect, test } from "@playwright/test";

test.describe("home first viewport and payment fail", () => {
  test("home shows featured project links and shop demo label", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "김선우" })).toBeVisible();
    await expect(page.locator("#about").getByText("KIM SUN WOO", { exact: true })).toBeVisible();

    const projects = page.locator("#projects");
    await expect(projects.getByRole("heading", { name: "Selected Work" })).toBeVisible();
    await expect(projects.getByRole("link", { name: /Trouble Shooting/ })).toHaveAttribute("href", "/community");
    await expect(projects.getByRole("link", { name: /E-Commerce Demo/ })).toHaveAttribute("href", "/shop");
    const shopDemo = projects.getByRole("link", { name: "쇼핑몰 데모 →" });
    await expect(shopDemo).toHaveAttribute("href", "/shop");

    const troubleshooting = page.locator("#troubleshooting");
    await expect(troubleshooting).toBeVisible();
    await expect(troubleshooting.getByRole("link", { name: "장바구니 정합성 ↗" })).toBeVisible();
    await expect(troubleshooting.getByRole("link", { name: "인증 갱신과 로그아웃 충돌 ↗" })).toBeVisible();
    await expect(troubleshooting.getByRole("link", { name: "배포 복구 ↗" })).toBeVisible();

    await shopDemo.click();
    await expect(page).toHaveURL(/\/shop$/);
    await expect(page.getByRole("heading", { level: 1, name: "SHOP" })).toBeVisible();
  });

  test("the introduction shows one slide and advances by buttons, keyboard and drag", async ({ page }) => {
    await page.goto("/#introduction");
    const introduction = page.locator("#introduction");
    const slides = introduction.locator('[role="region"][aria-label="자기소개 슬라이드"]');
    const previous = introduction.getByRole("button", { name: "이전 자기소개" });
    const next = introduction.getByRole("button", { name: "다음 자기소개" });
    const heading = (name: string) => slides.getByRole("heading", { name, exact: true });

    await expect(previous).toBeDisabled();
    await expect(slides.getByRole("article")).toHaveCount(1);
    await expect(heading("실무에서 맡은 일")).toBeVisible();
    await next.click();
    await expect(heading("개인 프로젝트로 넓힌 개발 경험")).toBeVisible();

    await slides.press("ArrowRight");
    await expect(heading("인증과 데이터 처리에서 보완한 부분")).toBeVisible();
    await expect.poll(() => slides.evaluate((element) => Math.abs(element.scrollLeft / element.clientWidth - 2))).toBeLessThan(0.01);

    await slides.scrollIntoViewIfNeeded();
    const box = await slides.boundingBox();
    if (!box) throw new Error("자기소개 슬라이드가 표시되지 않았습니다.");
    const viewportHeight = page.viewportSize()?.height ?? 720;
    const y = (Math.max(box.y, 72) + Math.min(box.y + box.height, viewportHeight)) / 2;
    await page.mouse.move(box.x + box.width * 0.7, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.35, y, { steps: 8 });
    await page.mouse.up();
    await expect(heading("RabbitMQ와 Kafka를 통한 후속 처리 학습")).toBeVisible();
    await expect(slides.getByRole("article")).toHaveCount(1);
    await previous.click();
    await expect(heading("인증과 데이터 처리에서 보완한 부분")).toBeVisible();
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
