import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { newAccount, seedServerCart } from "./support/browser-account";
import { bulkSeedDay, demoDaySummary } from "./support/isolated-db";

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

  await test.step("natural query applies age and resets previous filters", async () => {
    const input = page.getByLabel("자연어 질문 (DEMO 시연)");
    const convert = page.getByRole("button", { name: "필터로 변환" });
    const age = page.getByRole("checkbox", { name: "20대", exact: true });
    await expect(age).toBeAttached();
    await input.fill("2026년 10월 20대 매출");
    const ageRequest = page.waitForResponse((response) => {
      const url = new URL(response.url());
      return url.pathname.endsWith("/api/admin/purchase-analytics")
        && url.searchParams.get("from") === "2026-10-01"
        && url.searchParams.getAll("ageBand").includes("20대") && response.ok();
    });
    await convert.click();
    await expect(age).toBeChecked();
    await ageRequest;

    await input.fill("2026년 10월 전체 매출");
    await convert.click();
    await expect(age).not.toBeChecked();
    await expect(page.getByRole("status").filter({ hasText: "연령 전체" })).toBeVisible();

    await input.fill("2026년 10월 20대 남성 매출");
    await convert.click();
    await expect(page.getByRole("status").filter({ hasText: "인식하지 못한 조건" })).toBeVisible();
    await expect(age).not.toBeChecked();
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

  await test.step("bulk DEMO day matches the database rows seeded for that day", async () => {
    // CI seeds the bulk batch as of today (Seoul), so the default last-30-days view is never empty.
    // The day, quantity, and amount depend on the run date and catalog, so read them back from MySQL.
    const day = await bulkSeedDay();
    const expected = await demoDaySummary(day);
    expect(expected.orderCount).toBeGreaterThan(0);
    await page.getByLabel("시작일").fill(day);
    await page.getByLabel("종료일").fill(day);
    const analytics = page.waitForResponse((response) =>
      response.url().includes("/api/admin/purchase-analytics?")
      && response.url().includes(`from=${day}`)
      && response.url().includes(`to=${day}`)
      && response.url().includes("recordSource=DEMO")
      && response.ok());
    await page.getByLabel("기록 출처").selectOption("DEMO");
    const body = await (await analytics).json() as {
      dataBasis: string;
      summary: { orderCount: number; quantity: number; salesAmount: number };
    };
    expect(body.dataBasis).toBe("DATABASE");
    expect(body.summary.orderCount).toBe(expected.orderCount);
    expect(body.summary.quantity).toBe(expected.quantity);
    expect(body.summary.salesAmount).toBe(expected.salesAmount);
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
