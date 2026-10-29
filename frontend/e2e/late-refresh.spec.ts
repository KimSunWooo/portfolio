import { expect, test, type Page, type Request } from "@playwright/test";
import { newAccount, seedServerCart } from "./support/browser-account";
import { cartRows, removeBrowserAccount, removeStaleBrowserAccounts, verifyCatalog } from "./support/isolated-db";

async function holdFirstRefresh(page: Page, order: string[]): Promise<{
  serverResponded: Promise<void>;
  release: () => void;
}> {
  let release = () => {};
  const delivered = new Promise<void>((resolve) => {
    release = resolve;
  });
  let markServer = () => {};
  const serverResponded = new Promise<void>((resolve) => {
    markServer = resolve;
  });
  let held = false;
  await page.route("**/api/users/refresh", async (route) => {
    if (held) {
      await route.continue();
      return;
    }
    held = true;
    order.push("refresh-request-started");
    const response = await route.fetch();
    order.push(`refresh-server-responded:${response.status()}`);
    markServer();
    await delivered;
    order.push("refresh-response-delivered");
    await route.fulfill({ response });
  });
  return { serverResponded, release };
}

async function guestCartText(page: Page): Promise<string> {
  return page.evaluate(() => localStorage.getItem("guestCart") ?? "");
}

test("a refresh response that arrives after logout does not restore the browser session", async ({ page }) => {
  await removeStaleBrowserAccounts();
  const catalog = await verifyCatalog();
  const account = newAccount(catalog.productId, catalog.inkColorId);
  const order: string[] = [];
  const mutations: string[] = [];
  page.on("dialog", (dialog) => dialog.accept());
  page.on("request", (request: Request) => {
    const method = request.method();
    if (method !== "GET" && method !== "HEAD" && request.url().includes("/api/cart")) {
      mutations.push(`${method} ${new URL(request.url()).pathname}`);
    }
  });

  try {
    await test.step("login and keep a separate guest cart", async () => {
      await seedServerCart(account);
      await page.goto("/login");
      await page.getByRole("textbox", { name: "EMAIL" }).fill(account.email);
      await page.getByRole("textbox", { name: "PASSWORD" }).fill(account.password);
      await page.getByRole("button", { name: "LOG IN" }).click();
      await expect(page.getByRole("button", { name: "LOGOUT" })).toBeVisible();
      await page.evaluate(() => {
        localStorage.setItem("guestCart", JSON.stringify([{
          cartItemId: 9,
          productId: 1,
          productName: "Kept Local",
          price: 1000,
          quantity: 4,
          colorId: null,
          colorName: null,
        }]));
      });
      await page.goto("/cart");
      await expect(page.getByRole("button", { name: "LOGOUT" })).toBeVisible();
      expect(await cartRows(account.email)).toEqual([{ quantity: 2, colorId: null }]);
    });

    const held = await holdFirstRefresh(page, order);
    await test.step("start a real refresh, log out, then deliver the response", async () => {
      await page.evaluate(() => {
        const realNow = Date.now.bind(Date);
        Date.now = () => realNow() + 25 * 60 * 60 * 1000;
      });
      await page.getByRole("button", { name: "Verify Shade 수량 늘리기" }).click();
      await held.serverResponded;
      expect(order).toEqual([
        "refresh-request-started",
        "refresh-server-responded:200",
      ]);
      await page.getByRole("button", { name: "LOGOUT" }).click();
      order.push("logout-clicked");
      await expect(page.getByRole("link", { name: "LOGIN" })).toBeVisible();
      held.release();
      await expect(page.getByRole("link", { name: "LOGIN" })).toBeVisible();
      expect(order.indexOf("logout-clicked")).toBeLessThan(order.indexOf("refresh-response-delivered"));
    });

    await test.step("keep the guest cart and do not send the quantity change", async () => {
      expect(await guestCartText(page)).toContain("Kept Local");
      expect(await guestCartText(page)).toContain("\"quantity\":4");
      expect(mutations).toEqual([]);
      expect(await cartRows(account.email)).toEqual([{ quantity: 2, colorId: null }]);
    });

    await test.step("distinguish a restored cookie from server acceptance", async () => {
      await page.unroute("**/api/users/refresh");
      const cookieNames = (await page.context().cookies()).map((cookie) => cookie.name);
      const cookieState = cookieNames.includes("refreshToken")
        ? "cookie-present-after-late-response"
        : "cookie-absent-after-late-response";
      order.push(cookieState);
      test.info().annotations.push({ type: "refresh-cookie", description: cookieState });
      console.log(`[late-refresh] ${cookieState}`);
      const refresh = await page.request.post("http://localhost:8080/api/users/refresh", {
        headers: { Origin: "http://localhost:3000" },
      });
      expect(refresh.status()).toBe(401);
      order.push("server-rejected-refresh");
      expect(order).toContain("server-rejected-refresh");
      expect(order.some((entry) => entry.startsWith("cookie-"))).toBe(true);
    });

    await test.step("reload does not restore the session or resend the change", async () => {
      await page.reload();
      await expect(page.getByRole("link", { name: "LOGIN" })).toBeVisible();
      expect(await guestCartText(page)).toContain("Kept Local");
      expect(mutations).toEqual([]);
    });
  } finally {
    await removeBrowserAccount(account.email);
  }
});
