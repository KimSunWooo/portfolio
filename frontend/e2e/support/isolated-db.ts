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
