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

test("the same merge payload reuses one idempotency key", () => {
  const items = [{ productId: 7, quantity: 2 }];
  const first = api.guestCartSyncKey(items);
  const second = api.guestCartSyncKey(items);
  const changed = api.guestCartSyncKey([{ productId: 7, quantity: 3 }]);
  assert.equal(first, second);
  assert.notEqual(first, changed);
  assert.equal(api.guestCartSyncKey([{ productId: 7, quantity: 3 }]), changed);
});
