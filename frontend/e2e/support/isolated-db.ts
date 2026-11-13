import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const EMAIL_PATTERN = /^browser-flow-[a-z0-9]+@example\.test$/;
const MYSQL_CONTAINER = "portfolio-verify-mysql";
const REDIS_CONTAINER = "portfolio-verify-redis";

export type CartRow = { quantity: number; colorId: number | null };

function assertBrowserEmail(email: string): void {
  if (!EMAIL_PATTERN.test(email)) {
    throw new Error(`refusing to touch an account outside the browser-flow fixture: ${email}`);
  }
}

async function mysql(sql: string): Promise<string> {
  const { stdout } = await execFileAsync(
    "docker",
    ["exec", MYSQL_CONTAINER, "mysql", "-uroot", "-pverify-db", "-D", "portfolio_verify", "-N", "-e", sql],
    { encoding: "utf8" },
  );
  return stdout.trim();
}

export async function verifyCatalog(): Promise<{ productId: number; inkColorId: number }> {
  const productId = Number(await mysql(
    "SELECT id FROM products WHERE name='Verify Shade' ORDER BY id LIMIT 1;",
  ));
  const inkColorId = Number(await mysql(
    "SELECT id FROM product_colors WHERE product_id="
      + `${productId} AND color_name='Ink' ORDER BY id LIMIT 1;`,
  ));
  if (!Number.isInteger(productId) || productId <= 0 || !Number.isInteger(inkColorId) || inkColorId <= 0) {
    throw new Error("isolated catalog is missing Verify Shade or the Ink option");
  }
  return { productId, inkColorId };
}

export async function cartRows(email: string): Promise<CartRow[]> {
  assertBrowserEmail(email);
  const output = await mysql(
    "SELECT ci.quantity, IFNULL(ci.color_id, -1) "
      + "FROM cart_items ci "
      + "JOIN carts c ON c.id = ci.cart_id "
      + "JOIN users u ON u.id = c.user_id "
      + `WHERE u.email='${email}' ORDER BY IFNULL(ci.color_id, -1), ci.quantity;`,
  );
  if (!output) {
    return [];
  }
  return output.split("\n").filter(Boolean).map((line) => {
    const [quantity, color] = line.split("\t");
    const colorId = Number(color);
    return { quantity: Number(quantity), colorId: colorId < 0 ? null : colorId };
  });
}

export async function syncCount(email: string): Promise<number> {
  assertBrowserEmail(email);
  return Number(await mysql(
    `SELECT COUNT(*) FROM cart_sync_requests WHERE user_email='${email}';`,
  ));
}

export type DemoOrderRow = { recordSource: string; lineStatus: string; quantity: number; stockRestored: number };

export async function productStock(productId: number): Promise<number> {
  return Number(await mysql(`SELECT stock FROM products WHERE id=${Number(productId)};`));
}

export async function setProductStock(productId: number, stock: number): Promise<void> {
  await mysql(`UPDATE products SET stock=${Number(stock)} WHERE id=${Number(productId)}`);
}

export async function demoOrderRows(email: string): Promise<DemoOrderRow[]> {
  assertBrowserEmail(email);
  const output = await mysql(
    "SELECT o.record_source, l.line_status, l.quantity, l.stock_restored "
      + "FROM purchase_orders o "
      + "JOIN purchase_lines l ON l.order_key = o.order_key "
      + "JOIN users u ON u.id = o.user_id "
      + `WHERE u.email='${email}' ORDER BY l.id;`,
  );
  if (!output) {
    return [];
  }
  return output.split("\n").filter(Boolean).map((line) => {
    const [recordSource, lineStatus, quantity, stockRestored] = line.split("\t");
    return {
      recordSource,
      lineStatus,
      quantity: Number(quantity),
      stockRestored: Number(stockRestored),
    };
  });
}

/** Seoul calendar day that holds the most orders of the seeded bulk batch. */
export async function bulkSeedDay(): Promise<string> {
  const day = await mysql(
    "SELECT DATE(purchased_at) FROM purchase_orders WHERE record_source='DEMO' AND seed_batch_id LIKE 'bulk-%' "
      + "GROUP BY DATE(purchased_at) ORDER BY COUNT(*) DESC, DATE(purchased_at) DESC LIMIT 1;",
  );
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    throw new Error("no bulk DEMO batch is seeded in the isolated database");
  }
  return day;
}

export type DaySummary = { orderCount: number; quantity: number; salesAmount: number };

/** PAID DEMO lines for one Seoul calendar day, read straight from MySQL. */
export async function demoDaySummary(day: string): Promise<DaySummary> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    throw new Error(`invalid day: ${day}`);
  }
  const output = await mysql(
    "SELECT COUNT(DISTINCT o.order_key), IFNULL(SUM(l.quantity),0), IFNULL(SUM(l.line_amount),0) "
      + "FROM purchase_orders o JOIN purchase_lines l ON l.order_key = o.order_key "
      + "WHERE o.record_source='DEMO' AND l.line_status='PAID' "
      + `AND o.purchased_at >= '${day} 00:00:00' AND o.purchased_at < DATE_ADD('${day}', INTERVAL 1 DAY);`,
  );
  const [orderCount, quantity, salesAmount] = output.split("\t").map(Number);
  return { orderCount, quantity, salesAmount };
}

/** Payment rows are a separate store from DEMO orders. This counts only the 100원 test payment history. */
export async function paymentHistoryCount(email: string): Promise<number> {
  assertBrowserEmail(email);
  return Number(await mysql(`SELECT COUNT(*) FROM payment_histories WHERE user_email='${email}';`));
}

export async function removeStaleBrowserAccounts(): Promise<void> {
  const output = await mysql(
    "SELECT email FROM users WHERE email LIKE 'browser-flow-%@example.test';",
  );
  for (const email of output.split("\n").filter(Boolean)) {
    await removeBrowserAccount(email);
  }
}

export async function removeBrowserAccount(email: string): Promise<void> {
  assertBrowserEmail(email);
  const statements = [
    // DEMO orders made by this fixture user only (seed_batch_id IS NULL). Seed batches stay untouched.
    "DELETE r FROM demo_order_requests r JOIN users u ON u.id = r.user_id "
      + `WHERE u.email='${email}'`,
    "DELETE l FROM purchase_lines l JOIN purchase_orders o ON o.order_key = l.order_key "
      + "JOIN users u ON u.id = o.user_id "
      + `WHERE u.email='${email}' AND o.seed_batch_id IS NULL`,
    "DELETE o FROM purchase_orders o JOIN users u ON u.id = o.user_id "
      + `WHERE u.email='${email}' AND o.seed_batch_id IS NULL`,
    `DELETE FROM payment_histories WHERE user_email='${email}'`,
    "DELETE ci FROM cart_items ci "
      + "JOIN carts c ON c.id = ci.cart_id "
      + "JOIN users u ON u.id = c.user_id "
      + `WHERE u.email='${email}'`,
    "DELETE c FROM carts c JOIN users u ON u.id = c.user_id "
      + `WHERE u.email='${email}'`,
    `DELETE FROM cart_sync_requests WHERE user_email='${email}'`,
    `DELETE FROM users WHERE email='${email}'`,
  ];
  for (const statement of statements) {
    await mysql(statement);
  }
  await execFileAsync("docker", [
    "exec",
    REDIS_CONTAINER,
    "redis-cli",
    "DEL",
    `refresh-session:${email}`,
    `refresh-session-epoch:${email}`,
    `refresh-session-previous:${email}`,
  ]);
}
