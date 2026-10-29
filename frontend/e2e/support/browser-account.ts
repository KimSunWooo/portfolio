import { randomBytes } from "node:crypto";

const API = "http://127.0.0.1:8080";

export type BrowserAccount = {
  email: string;
  password: string;
  productId: number;
  inkColorId: number;
};

export function newAccount(productId: number, inkColorId: number): BrowserAccount {
  return {
    email: `browser-flow-${randomBytes(6).toString("hex")}@example.test`,
    password: `vfy-${randomBytes(18).toString("hex")}`,
    productId,
    inkColorId,
  };
}

async function api(path: string, init: RequestInit = {}): Promise<Response> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Origin: "http://localhost:3000",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  return response;
}

export async function seedServerCart(account: BrowserAccount): Promise<void> {
  const signup = await api("/api/users/signUp", {
    method: "POST",
    body: JSON.stringify({ email: account.email, password: account.password, name: "브라우저검증" }),
  });
  if (!signup.ok) {
    throw new Error(`signup failed with ${signup.status}`);
  }
  const login = await api("/api/users/login", {
    method: "POST",
    body: JSON.stringify({ email: account.email, password: account.password }),
  });
  if (!login.ok) {
    throw new Error(`seed login failed with ${login.status}`);
  }
  const body = await login.json() as { accessToken?: string };
  if (!body.accessToken) {
    throw new Error("seed login did not return an access token");
  }
  const added = await api("/api/cart", {
    method: "POST",
    headers: { Authorization: `Bearer ${body.accessToken}` },
    body: JSON.stringify({ productId: account.productId, quantity: 2 }),
  });
  if (!added.ok) {
    throw new Error(`seed cart failed with ${added.status}`);
  }
  const logout = await api("/api/users/logout", { method: "POST" });
  if (!logout.ok && logout.status !== 200) {
    throw new Error(`seed logout failed with ${logout.status}`);
  }
}

export function guestCart(account: BrowserAccount) {
  return [
    {
      cartItemId: 1,
      productId: account.productId,
      productName: "Verify Shade",
      price: 12000,
      quantity: 98,
      colorId: null,
      colorName: null,
    },
    {
      cartItemId: 2,
      productId: account.productId,
      productName: "Verify Shade",
      price: 12000,
      quantity: 1,
      colorId: account.inkColorId,
      colorName: "Ink",
    },
  ];
}
