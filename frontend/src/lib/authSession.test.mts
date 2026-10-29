import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";

type Store = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  key: (index: number) => string | null;
  readonly length: number;
};

function memoryStore(): Store {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
    clear: () => data.clear(),
    key: (index) => [...data.keys()][index] ?? null,
    get length() {
      return data.size;
    },
  };
}

const local = memoryStore();
const session = memoryStore();
const listeners = new Map<string, Array<(event: Event) => void>>();

class TestEvent {
  type: string;
  constructor(type: string) {
    this.type = type;
  }
}

Object.assign(globalThis, {
  window: globalThis,
  localStorage: local,
  sessionStorage: session,
  Event: TestEvent,
  dispatchEvent(event: { type: string }) {
    for (const listener of listeners.get(event.type) ?? []) {
      listener(event as Event);
    }
    return true;
  },
  addEventListener(type: string, listener: (event: Event) => void) {
    const current = listeners.get(type) ?? [];
    current.push(listener);
    listeners.set(type, current);
  },
  removeEventListener(type: string, listener: (event: Event) => void) {
    listeners.set(
      type,
      (listeners.get(type) ?? []).filter((item) => item !== listener),
    );
  },
});
process.env.NEXT_PUBLIC_API_URL = "http://api.test";
process.env.INTERNAL_API_URL = "http://api.test";

const api = await import("./api.ts");

function token(payload: Record<string, unknown>) {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "none", typ: "JWT" })}.${encode(payload)}.sig`;
}

const validToken = token({
  sub: "user@example.com",
  role: "ROLE_USER",
  tokenType: "access",
  exp: Math.floor(Date.now() / 1000) + 3600,
});
const expiredToken = token({
  sub: "user@example.com",
  role: "ROLE_USER",
  tokenType: "access",
  exp: 1,
});

beforeEach(() => {
  local.clear();
  session.clear();
  api.removeAccessToken();
  globalThis.fetch = (async () => new Response(null, { status: 500 })) as typeof fetch;
});

test("expired access token is not stored in the guest cart when refresh fails", async () => {
  api.setAccessToken(expiredToken);
  let refreshCalls = 0;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith("/api/users/refresh")) {
      refreshCalls += 1;
      return new Response("{}", { status: 401 });
    }
    throw new Error(`unexpected ${url}`);
  }) as typeof fetch;

  await assert.rejects(
    () => api.addCartItem({ id: 7, name: "Lip", price: 1000, thumbnail: null }, 1),
    (error: unknown) => error instanceof api.ApiRequestError && error.kind === "recovery_failed",
  );
  assert.equal(refreshCalls, 1);
  assert.equal(local.getItem("guestCart"), null);
});

test("a guest still keeps the local cart", async () => {
  globalThis.fetch = (async () => new Response("{}", { status: 401 })) as typeof fetch;
  await api.addCartItem({ id: 7, name: "Lip", price: 1000, thumbnail: null }, 1);
  const stored = JSON.parse(local.getItem("guestCart") ?? "[]") as Array<{ productId: number; quantity: number }>;
  assert.deepEqual(stored.map((item) => ({ productId: item.productId, quantity: item.quantity })), [
    { productId: 7, quantity: 1 },
  ]);
});

test("concurrent refresh uses one request", async () => {
  let refreshCalls = 0;
  globalThis.fetch = (async () => {
    refreshCalls += 1;
    await new Promise((resolve) => setTimeout(resolve, 20));
    return Response.json({ accessToken: validToken });
  }) as typeof fetch;

  const results = await Promise.all([api.ensureAccessToken(), api.ensureAccessToken(), api.ensureAccessToken()]);
  assert.equal(refreshCalls, 1);
  assert.deepEqual(results, [validToken, validToken, validToken]);
});

test("network failure while recovering is not treated as a guest", async () => {
  api.setAccessToken(expiredToken);
  globalThis.fetch = (async () => {
    throw new Error("timeout");
  }) as typeof fetch;
  const auth = await api.resolveAuthState();
  assert.equal(auth.phase, "recovery_failed");
  assert.equal(local.getItem("guestCart"), null);
});

test("forbidden response does not refresh again", async () => {
  api.setAccessToken(validToken);
  let refreshCalls = 0;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith("/api/users/refresh")) {
      refreshCalls += 1;
      return Response.json({ accessToken: validToken });
    }
    return new Response("{}", { status: 403 });
  }) as typeof fetch;

  await assert.rejects(
    () => api.authorizedFetch("http://api.test/api/admin/products"),
    (error: unknown) => error instanceof api.ApiRequestError && error.kind === "forbidden",
  );
  assert.equal(refreshCalls, 0);
});

test("a cart change is not resent after an authentication failure", async () => {
  api.setAccessToken(validToken);
  const calls: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.push(url);
    if (url.endsWith("/api/users/refresh")) {
      return Response.json({ accessToken: validToken });
    }
    return new Response("{}", { status: 401 });
  }) as typeof fetch;

  await assert.rejects(() => api.addToCart(7, 1), api.ApiRequestError);
  assert.deepEqual(calls, ["http://api.test/api/cart", "http://api.test/api/users/refresh"]);
});

test("a refresh that finishes after logout does not restore the session or the cart", async () => {
  local.setItem("guestCart", JSON.stringify([{ productId: 7, productName: "Lip", price: 1000, quantity: 1 }]));
  const gate: { release: ((response: Response) => void) | null } = { release: null };
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith("/api/users/refresh")) {
      return new Promise<Response>((resolve) => {
        gate.release = resolve;
      });
    }
    if (url.endsWith("/api/users/logout")) {
      return Response.json({ status: "revoked" });
    }
    throw new Error(`unexpected ${url}`);
  }) as typeof fetch;

  const pending = api.resolveAuthState();
  await new Promise((resolve) => setTimeout(resolve, 0));
  const logout = await api.logoutUser();
  if (!gate.release) {
    throw new Error("refresh did not start");
  }
  gate.release(Response.json({ accessToken: validToken }));
  const auth = await pending;

  assert.equal(logout, "revoked");
  assert.equal(auth.phase, "guest");
  assert.equal(api.getAccessToken(), null);
  assert.equal(api.getAuthPhase(), "guest");
  assert.equal(local.getItem("guestCart")?.includes("Lip"), true);
});

test("an incomplete logout is not reported as a completed server logout", async () => {
  local.setItem("guestCart", JSON.stringify([{ productId: 7, productName: "Lip", price: 1000, quantity: 1 }]));
  globalThis.fetch = (async () => new Response("{}", { status: 503 })) as typeof fetch;
  const logout = await api.logoutUser();
  assert.equal(logout, "incomplete");
  assert.equal(api.getAuthPhase(), "recovery_failed");
  assert.equal(api.getAccessToken(), null);
  assert.equal(local.getItem("guestCart")?.includes("Lip"), true);
});

test("password cleanup failure stays distinct from a rejected change", async () => {
  globalThis.fetch = (async () => new Response(
    "비밀번호는 변경되었습니다. 이전 로그인은 더 이상 갱신할 수 없습니다. 다시 로그인해 주세요.",
    { status: 503 }
  )) as typeof fetch;
  const incomplete = await api.resetPassword("member@example.test", "000000", "next-password");
  assert.equal(incomplete.status, "cleanup_incomplete");
  assert.match(incomplete.message, /비밀번호는 변경되었습니다/);

  globalThis.fetch = (async () => new Response("인증 코드가 일치하지 않거나 만료되었습니다.", { status: 400 })) as typeof fetch;
  await assert.rejects(() => api.resetPassword("member@example.test", "000000", "next-password"));
});

test("the same merge payload reuses one idempotency key", () => {
  const items = [{ productId: 7, quantity: 2 }];
  const first = api.guestCartSyncKey(items);
  const second = api.guestCartSyncKey(items);
  const changed = api.guestCartSyncKey([{ productId: 7, quantity: 3 }]);
  assert.equal(first, second);
  assert.notEqual(first, changed);
  assert.equal(api.guestCartSyncKey([{ productId: 7, quantity: 3 }]), changed);
  assert.notEqual(
    api.guestCartSyncKey([{ productId: 7, quantity: 2, colorId: 1 }]),
    api.guestCartSyncKey([{ productId: 7, quantity: 2, colorId: 2 }])
  );
});
