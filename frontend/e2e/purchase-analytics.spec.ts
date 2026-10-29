import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { newAccount, seedServerCart } from "./support/browser-account";

function verifyAdmin(): { email: string; password: string; productId: number } {
  const file = path.resolve(process.cwd(), "../backend/build/verify-accounts.properties");
  const text = readFileSync(file, "utf8");
  const email = text.match(/^adminEmail=(.*)$/m)?.[1]?.trim();
  const password = text.match(/^adminPassword=(.*)$/m)?.[1]?.trim();
  const productId = Number(text.match(/^productId=(.*)$/m)?.[1]?.trim());
  if (!email || !password || !Number.isFinite(productId)) {
    throw new Error("verify admin credentials are missing");
  }
  return { email, password, productId };
}

async function login(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "EMAIL" }).fill(email);
  await page.getByRole("textbox", { name: "PASSWORD" }).fill(password);
  await page.getByRole("button", { name: "LOG IN" }).click();
  await expect(page.getByRole("button", { name: "LOGOUT" })).toBeVisible();
}

test("admin purchase analytics reads database aggregates", async ({ page }) => {
  const admin = verifyAdmin();
  page.on("dialog", (dialog) => dialog.accept());

  await test.step("login as verify admin", async () => {
    await login(page, admin.email, admin.password);
  });

  let shopSummary: { orderCount: number; quantity: number; salesAmount: number } | null = null;

  await test.step("/admin/shop DASHBOARD shows DB charts and applied range", async () => {
    const analytics = page.waitForResponse((response) =>
      response.url().includes("/api/admin/purchase-analytics?") && response.ok());
    await page.goto("/admin/shop");
    const body = await (await analytics).json() as {
      dataBasis: string;
      includesDemoRecords: boolean;
      summary: { orderCount: number; quantity: number; salesAmount: number };
    };
    expect(body.dataBasis).toBe("DATABASE");
    expect(body.summary.orderCount).toBeGreaterThanOrEqual(80);
    shopSummary = body.summary;
    await expect(page.getByRole("heading", { name: "구매 요약", exact: true })).toBeVisible();
    await expect(page.getByTestId("purchase-applied-range")).toContainText("적용 기간:");
    await expect(page.getByTestId("purchase-applied-range")).toContainText("기본값 최근 30일");
    await expect(page.getByRole("region", { name: "기간별 상품 판매금액 추이" })).toBeVisible();
    await expect(page.getByRole("region", { name: "상품분류별 상품 판매금액 비교" })).toBeVisible();
    await expect(page.getByText(`${body.summary.orderCount.toLocaleString("ko-KR")}건`)).toBeVisible();
  });

  await test.step("detail link keeps the same filter summary", async () => {
    const analytics = page.waitForResponse((response) =>
      response.url().includes("/api/admin/purchase-analytics?") && response.ok());
    await page.getByRole("link", { name: "상세 분석 →" }).click();
    await expect(page).toHaveURL(/\/admin\/purchases/);
    const body = await (await analytics).json() as {
      dataBasis: string;
      summary: { orderCount: number; quantity: number; salesAmount: number };
    };
    expect(body.dataBasis).toBe("DATABASE");
    expect(shopSummary).not.toBeNull();
    expect(body.summary.orderCount).toBe(shopSummary!.orderCount);
    expect(body.summary.quantity).toBe(shopSummary!.quantity);
    expect(body.summary.salesAmount).toBe(shopSummary!.salesAmount);
    await expect(page.getByRole("heading", { name: "구매 분석", exact: true })).toBeVisible();
    await expect(page.getByRole("region", { name: "기간별 상품 판매금액 추이" })).toBeVisible();
    await expect(page.getByRole("region", { name: "상품분류별 상품 판매금액 비교" })).toBeVisible();
  });

  await test.step("legacy DEMO mid-October stays 2/6/72500 without the bulk batch", async () => {
    await page.getByLabel("시작일").fill("2026-10-01");
    await page.getByLabel("종료일").fill("2026-10-15");
    const analytics = page.waitForResponse((response) =>
      response.url().includes("/api/admin/purchase-analytics?")
      && response.url().includes("from=2026-10-01")
      && response.url().includes("to=2026-10-15")
      && response.url().includes("recordSource=DEMO")
      && response.ok());
    await page.getByLabel("기록 출처").selectOption("DEMO");
    const body = await (await analytics).json() as {
      dataBasis: string;
      summary: { orderCount: number; quantity: number; salesAmount: number };
    };
    expect(body.dataBasis).toBe("DATABASE");
    expect(body.summary.orderCount).toBe(2);
    expect(body.summary.quantity).toBe(6);
    expect(body.summary.salesAmount).toBe(72500);
    await expect(page.getByRole("status").filter({ hasText: "시연용 구매기록 포함" })).toBeVisible();
    await expect(page.getByText("조회 오류")).toHaveCount(0);
  });

  await test.step("bulk DEMO day has 300 paid orders", async () => {
    await page.getByLabel("시작일").fill("2026-10-29");
    await page.getByLabel("종료일").fill("2026-10-29");
    const analytics = page.waitForResponse((response) =>
      response.url().includes("/api/admin/purchase-analytics?")
      && response.url().includes("from=2026-10-29")
      && response.url().includes("to=2026-10-29")
      && response.url().includes("recordSource=DEMO")
      && response.ok());
    await page.getByLabel("기록 출처").selectOption("DEMO");
    const body = await (await analytics).json() as {
      dataBasis: string;
      summary: { orderCount: number; quantity: number; salesAmount: number };
    };
    expect(body.summary.orderCount).toBe(300);
    expect(body.summary.quantity).toBe(582);
    expect(body.summary.salesAmount).toBe(6804967);
  });
});

test("non-admin cannot open purchase analytics", async ({ page }) => {
  const admin = verifyAdmin();
  const member = newAccount(admin.productId, 2);
  await seedServerCart(member);
  page.on("dialog", (dialog) => dialog.accept());

  await test.step("member is redirected away from /admin/purchases", async () => {
    await login(page, member.email, member.password);
    await page.goto("/admin/purchases");
    await expect(page).not.toHaveURL(/\/admin\/purchases/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "구매 분석", exact: true })).toHaveCount(0);
  });
});
