import axios from 'axios';

const IS_SERVER = typeof window === "undefined";

// 💡 수정된 API_BASE_URL 설정
const API_BASE_URL = IS_SERVER
  // 서버 사이드(SSR) 일 때: INTERNAL_API_URL을 우선으로 보되, 없으면 localhost (로컬 개발용 방어막)
  ? (process.env.INTERNAL_API_URL || "http://localhost:8080")
  
  // 클라이언트(브라우저) 일 때: NEXT_PUBLIC_API_URL을 우선으로 보되, 없으면 localhost
  : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080");

export const api = axios.create({
  baseURL: API_BASE_URL,
});

/* =========================================================================
 * 0. 메모리 토큰 저장소 및 헬퍼 함수
 * ========================================================================= */
let inMemoryAccessToken: string | null = null;

export const getAccessToken = (): string | null => {
  return inMemoryAccessToken;
};

/**
 * JWT Payload를 파싱합니다.
 *
 * 현재 백엔드는 다음 형태로 JWT를 생성합니다.
 *
 * {
 *   sub: email,
 *   role: "ROLE_USER" | "ROLE_ADMIN",
 *   exp: ...
 * }
 */
export const getAccessTokenPayload = (
  token: string | null = inMemoryAccessToken
): Record<string, any> | null => {
  if (!token) {
    return null;
  }

  try {
    const parts = token.split(".");

    if (parts.length !== 3) {
      return null;
    }

    const base64Payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(parts[1].length / 4) * 4, "=");

    return JSON.parse(atob(base64Payload));
  } catch (error) {
    console.error("Access Token Payload 파싱 실패:", error);
    return null;
  }
};

/**
 * Access Token의 만료 여부를 확인합니다.
 */
export const isAccessTokenValid = (
  token: string | null = inMemoryAccessToken
): boolean => {
  const payload = getAccessTokenPayload(token);

  if (!payload?.exp) {
    return false;
  }

  return payload.exp * 1000 > Date.now();
};

/**
 * Access Token의 role을 기준으로 관리자 여부를 확인합니다.
 *
 * 백엔드 JwtTokenProvider에서:
 * user.getRole().name()
 *
 * 을 전달하고 있으므로 현재 관리자 role은 "ROLE_ADMIN"입니다.
 */
export const isAdminFromToken = (
  token: string | null = inMemoryAccessToken
): boolean => {
  const payload = getAccessTokenPayload(token);

  if (!payload) {
    return false;
  }

  return payload.role === "ROLE_ADMIN";
};

/**
 * Access Token을 메모리에 저장합니다.
 *
 * localStorage에는 저장하지 않습니다.
 * Refresh Token은 백엔드의 HttpOnly Cookie에서 관리합니다.
 */
export const setAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("authStateChanged"));
  }
};

/**
 * Access Token 제거
 */
export const removeAccessToken = () => {
  inMemoryAccessToken = null;

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("authStateChanged"));

    // 과거 버전에서 사용했던 accessToken 찌꺼기 제거
    localStorage.removeItem("accessToken");
  }
};

const getAuthHeaders = (isJson: boolean = true): HeadersInit => {
  const headers: Record<string, string> = {};

  if (isJson) {
    headers["Content-Type"] = "application/json";
  }

  if (inMemoryAccessToken) {
    headers["Authorization"] = `Bearer ${inMemoryAccessToken}`;
  }

  return headers;
};

export async function handleResponseError(response: Response) {
  const errorText = await response.clone().text();

  let errorMessage = "요청 처리에 실패했습니다.";

  try {
    const errorJson = JSON.parse(errorText);
    errorMessage = errorJson.message || errorMessage;
  } catch {
    errorMessage = errorText || errorMessage;
  }

  throw new Error(errorMessage);
}

export function resolveAssetUrl(path?: string | null) {
  if (!path) {
    return null;
  }

  if (path.startsWith("http")) {
    return path;
  }

  const PUBLIC_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  return `${PUBLIC_URL}${path}`;
}

/* =========================================================================
 * 1. 이력서 (Resume) 관련 타입
 * ========================================================================= */
export interface ResumeProfile { id?: number; name: string; jobTitle?: string; githubUrl?: string; shortIntro?: string; email?: string; phone?: string; profileImage?: string; }
export interface ResumeSkill { id: number; name: string; category?: string; level?: string; sortOrder: number; }
export interface ResumeExperience { id: number; companyName: string; position: string; startDate?: string | null; endDate?: string | null; description?: string; sortOrder: number; }
export interface ResumeEducation { id: number; schoolName: string; major?: string; startDate?: string | null; endDate?: string | null; description?: string; sortOrder: number; }
export interface ResumeIntroduction { id: number; title?: string; content: string; sortOrder: number; }

export interface ResumeData {
  profile: ResumeProfile;
  skills: ResumeSkill[];
  experiences: ResumeExperience[];
  educations: ResumeEducation[];
  introductions: ResumeIntroduction[];
}

/* =========================================================================
 * 2. 프로젝트 (Project & Media) 관련 타입
 * ========================================================================= */
export type ProjectStatus = "IN_PROGRESS" | "COMPLETED" | "PLANNING" | string;

export interface PortfolioProject {
  id: number;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  techStack?: string | null;
  projectUrl?: string | null;
  githubUrl?: string | null;
  thumbnail?: string | null; 
  status: ProjectStatus;
  isFeatured: boolean;
  sortOrder: number;
  startDate?: string | null; 
  endDate?: string | null;   
}

export interface ProjectRequest {
  title: string;
  subtitle?: string | null;
  description?: string | null;
  techStack?: string | null;
  projectUrl?: string | null;
  githubUrl?: string | null;
  thumbnail?: string | null;
  status: ProjectStatus;
  isFeatured: boolean;
  sortOrder: number;
  startDate?: string | null;
  endDate?: string | null;
}

export interface ProjectMedia {
  id: number;
  mediaUrl: string;
  mediaType: string;
  caption?: string | null;
  altText?: string | null;
  sortOrder: number;
  description: string;
}

/* =========================================================================
 * 3. 상품 (Product) 관련 타입
 * ========================================================================= */
export interface ProductListResponse { id: number; name: string; price: number; originalPrice?: number | null; thumbnail?: string | null; isNew?: boolean; isBest?: boolean; category?: string | null; }
export interface ProductImage { id: number; imageUrl?: string; imageType?: "MAIN" | "THUMBNAIL" | "DETAIL" | string; altText?: string | null; sortOrder: number; }
export interface ProductDetailInfo { description?: string; shortDescription?: string; usageInfo?: string; ingredients?: string; productInfo?: string; }
export interface ProductColor { id: number; colorName: string; colorCode: string; }

export interface ProductDetailResponse extends ProductListResponse {
  stockQuantity?: number;
  detail?: ProductDetailInfo;
  images?: ProductImage[];
  colors?: ProductColor[];
}

export interface AdminProduct extends ProductListResponse {
  subtitle?: string | null;
  stock?: number;
  status?: string;
  description: string;
  color?:string[];
}

export interface ProductRequest {
  name: string;
  subtitle?: string | null;
  description?: string | null;
  category?: string | null;
  price: number;
  originalPrice?: number | null;
  thumbnail?: string | null;
  isNew?: boolean;
  isBest?: boolean;
  stock?: number;
  status?: string;
  color?:string[];
}

/* =========================================================================
 * 4. 인증(Auth) API
 * ========================================================================= */
export async function signupUser(userData: { email: string; password: string; name?: string }) {
  const response = await fetch(`${API_BASE_URL}/api/users/signUp`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(userData),
  });
  if (!response.ok) await handleResponseError(response); return response.text();
}

export async function loginUser(credentials: {
  email: string;
  password: string;
}) {
  const response = await fetch(`${API_BASE_URL}/api/users/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
    credentials: "include",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText);
  }

  const data = await response.json();

  if (!data.accessToken) {
    throw new Error("Access Token을 전달받지 못했습니다.");
  }

  setAccessToken(data.accessToken);

  return data;
}

export async function silentRefresh() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      setAccessToken(null);
      return null;
    }

    const data = await response.json();

    if (!data.accessToken) {
      setAccessToken(null);
      return null;
    }

    setAccessToken(data.accessToken);

    return data.accessToken;
  } catch (error) {
    setAccessToken(null);
    return null;
  }
}

export async function logoutUser() {
  try {
    await fetch(`${API_BASE_URL}/api/users/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch (error) {
    // 로그아웃 요청 실패와 관계없이 클라이언트 인증 상태는 제거
  } finally {
    removeAccessToken();
  }
}

/* =========================================================================
 * 5. 이력서 (Resume) API
 * ========================================================================= */
export async function fetchResume(): Promise<ResumeData> {
  const response = await fetch(`${API_BASE_URL}/api/resume`);
  if (!response.ok) throw new Error("이력서 데이터를 불러오는데 실패했습니다.");
  return response.json();
}

export async function updateResumeProfile(profileData: any) {
  const isFormData = typeof FormData !== "undefined" && profileData instanceof FormData;
  const response = await fetch(`${API_BASE_URL}/api/admin/resume/profile`, {
    method: "PUT", headers: getAuthHeaders(!isFormData), body: isFormData ? profileData : JSON.stringify(profileData), credentials: "include",
  });
  if (!response.ok) await handleResponseError(response); return response.ok;
}

export async function createResumeEducation(data: any) { const response = await fetch(`${API_BASE_URL}/api/admin/resume/educations`, { method: "POST", headers: getAuthHeaders(true), body: JSON.stringify(data), credentials: "include" }); if (!response.ok) await handleResponseError(response); return response.ok; }
export async function updateResumeEducation(id: number, data: any) { const response = await fetch(`${API_BASE_URL}/api/admin/resume/educations/${id}`, { method: "PUT", headers: getAuthHeaders(true), body: JSON.stringify(data), credentials: "include" }); if (!response.ok) await handleResponseError(response); return response.ok; }
export async function deleteResumeEducation(id: number) { const response = await fetch(`${API_BASE_URL}/api/admin/resume/educations/${id}`, { method: "DELETE", headers: getAuthHeaders(true), credentials: "include" }); if (!response.ok) await handleResponseError(response); return response.ok; }

export async function createResumeExperience(data: any) { const response = await fetch(`${API_BASE_URL}/api/admin/resume/experiences`, { method: "POST", headers: getAuthHeaders(true), body: JSON.stringify(data), credentials: "include" }); if (!response.ok) await handleResponseError(response); return response.ok; }
export async function updateResumeExperience(id: number, data: any) { const response = await fetch(`${API_BASE_URL}/api/admin/resume/experiences/${id}`, { method: "PUT", headers: getAuthHeaders(true), body: JSON.stringify(data), credentials: "include" }); if (!response.ok) await handleResponseError(response); return response.ok; }
export async function deleteResumeExperience(id: number) { const response = await fetch(`${API_BASE_URL}/api/admin/resume/experiences/${id}`, { method: "DELETE", headers: getAuthHeaders(true), credentials: "include" }); if (!response.ok) await handleResponseError(response); return response.ok; }

export async function createResumeSkill(data: any) { const response = await fetch(`${API_BASE_URL}/api/admin/resume/skills`, { method: "POST", headers: getAuthHeaders(true), body: JSON.stringify(data), credentials: "include" }); if (!response.ok) await handleResponseError(response); return response.ok; }
export async function updateResumeSkill(id: number, data: any) { const response = await fetch(`${API_BASE_URL}/api/admin/resume/skills/${id}`, { method: "PUT", headers: getAuthHeaders(true), body: JSON.stringify(data), credentials: "include" }); if (!response.ok) await handleResponseError(response); return response.ok; }
export async function deleteResumeSkill(id: number) { const response = await fetch(`${API_BASE_URL}/api/admin/resume/skills/${id}`, { method: "DELETE", headers: getAuthHeaders(true), credentials: "include" }); if (!response.ok) await handleResponseError(response); return response.ok; }

export async function createResumeIntroduction(data: any) { const response = await fetch(`${API_BASE_URL}/api/admin/resume/introductions`, { method: "POST", headers: getAuthHeaders(true), body: JSON.stringify(data), credentials: "include" }); if (!response.ok) await handleResponseError(response); return response.ok; }
export async function updateResumeIntroduction(id: number, data: any) { const response = await fetch(`${API_BASE_URL}/api/admin/resume/introductions/${id}`, { method: "PUT", headers: getAuthHeaders(true), body: JSON.stringify(data), credentials: "include" }); if (!response.ok) await handleResponseError(response); return response.ok; }
export async function deleteResumeIntroduction(id: number) { const response = await fetch(`${API_BASE_URL}/api/admin/resume/introductions/${id}`, { method: "DELETE", headers: getAuthHeaders(true), credentials: "include" }); if (!response.ok) await handleResponseError(response); return response.ok; }

/* =========================================================================
 * 6. 프로젝트 (Project & Media) API
 * ========================================================================= */
export async function fetchProjects(isFeatured?: boolean): Promise<PortfolioProject[]> {
  const url = isFeatured ? `${API_BASE_URL}/api/projects?featured=true` : `${API_BASE_URL}/api/projects`;
  const response = await fetch(url, { cache: "no-store" }); 
  if (!response.ok) throw new Error("프로젝트 데이터를 불러오는데 실패했습니다."); return response.json();
}

export async function fetchProject(projectId: number | string): Promise<PortfolioProject> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`);
  if (!response.ok) await handleResponseError(response); return response.json();
}

// 💡 프로젝트 등록/수정/삭제 모두 /api/admin 경로로 변경
export async function createProject(projectData: any) {
  const isFormData = typeof FormData !== "undefined" && projectData instanceof FormData;
  const response = await fetch(`${API_BASE_URL}/api/admin/projects`, { 
    method: "POST", headers: getAuthHeaders(!isFormData), body: isFormData ? projectData : JSON.stringify(projectData), credentials: "include" 
  });
  if (!response.ok) await handleResponseError(response); return response.json();
}

export async function updateProject(projectId: number | string, projectData: any) {
  const isFormData = typeof FormData !== "undefined" && projectData instanceof FormData;
  const response = await fetch(`${API_BASE_URL}/api/admin/projects/${projectId}`, { 
    method: "PUT", headers: getAuthHeaders(!isFormData), body: isFormData ? projectData : JSON.stringify(projectData), credentials: "include" 
  });
  if (!response.ok) await handleResponseError(response); return response.ok;
}

export async function deleteProject(projectId: number | string) {
  const response = await fetch(`${API_BASE_URL}/api/admin/projects/${projectId}`, { method: "DELETE", headers: getAuthHeaders(true), credentials: "include" });
  if (!response.ok) await handleResponseError(response); return response.text();
}

export async function fetchProjectMedia(projectId: number | string): Promise<ProjectMedia[]> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/media`);
  if (!response.ok) await handleResponseError(response); return response.json();
}

export async function createProjectMedia(projectId: number, data: any) {
  const formData = new FormData();
  formData.append("file", data.file); 
  formData.append("caption", data.caption || "");
  formData.append("description", data.description || "");
  formData.append("altText", data.altText || "");
  formData.append("sortOrder", String(data.sortOrder));

  const token = getAccessToken();
  const response = await fetch(`${API_BASE_URL}/api/admin/projects/${projectId}/media`, {
    method: "POST", credentials: "include", headers: { ...(token ? { "Authorization": `Bearer ${token}` } : {}) }, body: formData, 
  });
  if (!response.ok) throw new Error("미디어 업로드에 실패했습니다."); return response.json();
}

export async function updateProjectMedia(projectId: number | string, mediaId: number | string, data: any) {
  const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
  const response = await fetch(`${API_BASE_URL}/api/admin/projects/${projectId}/media/${mediaId}`, { 
    method: "PUT", headers: getAuthHeaders(!isFormData), body: isFormData ? data : JSON.stringify(data), credentials: "include" 
  });
  if (!response.ok) await handleResponseError(response); return response.ok;
}

export async function deleteProjectMedia(projectId: number | string, mediaId: number | string) {
  const response = await fetch(`${API_BASE_URL}/api/admin/projects/${projectId}/media/${mediaId}`, { method: "DELETE", headers: getAuthHeaders(true), credentials: "include" });
  if (!response.ok) await handleResponseError(response); return response.ok;
}

/* =========================================================================
 * 7. 상품 (Product & Image) API
 * ========================================================================= */
export async function fetchProducts(category?: string): Promise<ProductListResponse[]> {
  const url = category ? `${API_BASE_URL}/api/products?category=${encodeURIComponent(category)}` : `${API_BASE_URL}/api/products`;
  const response = await fetch(url);
  if (!response.ok) await handleResponseError(response); return response.json();
}

export async function getProductById(productId: number | string): Promise<ProductDetailResponse> {
  const response = await fetch(`${API_BASE_URL}/api/products/${productId}`);
  if (!response.ok) await handleResponseError(response); return response.json();
}

// Admin 영역 (이미 규칙에 맞음)
export async function fetchAdminProducts(): Promise<AdminProduct[]> {
  const response = await fetch(`${API_BASE_URL}/api/admin/products`, { headers: getAuthHeaders(true), credentials: "include" });
  if (!response.ok) await handleResponseError(response); return response.json();
}

export async function createProduct(productData: any) {
  const isFormData = typeof FormData !== "undefined" && productData instanceof FormData;
  const response = await fetch(`${API_BASE_URL}/api/admin/products`, { method: "POST", headers: getAuthHeaders(!isFormData), body: isFormData ? productData : JSON.stringify(productData), credentials: "include" });
  if (!response.ok) await handleResponseError(response); return response.json();
}

export async function updateProduct(productId: number | string, productData: any) {
  const isFormData = typeof FormData !== "undefined" && productData instanceof FormData;
  const response = await fetch(`${API_BASE_URL}/api/admin/products/${productId}`, { method: "PUT", headers: getAuthHeaders(!isFormData), body: isFormData ? productData : JSON.stringify(productData), credentials: "include" });
  if (!response.ok) await handleResponseError(response); return response.ok;
}

export async function deleteProduct(productId: number | string) {
  const response = await fetch(`${API_BASE_URL}/api/admin/products/${productId}`, { method: "DELETE", headers: getAuthHeaders(true), credentials: "include" });
  if (!response.ok) await handleResponseError(response); return response.text();
}

export async function fetchProductImages(productId: number | string): Promise<ProductImage[]> {
  const response = await fetch(`${API_BASE_URL}/api/products/${productId}/images`);
  if (!response.ok) await handleResponseError(response); return response.json();
}

export async function uploadProductImage(productId: number | string, data: any) {
  const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
  let finalBody = data;
  if (!isFormData && data.file) {
    const formData = new FormData();
    formData.append("file", data.file);
    if(data.imageType) formData.append("imageType", data.imageType);
    if(data.altText) formData.append("altText", data.altText);
    if(data.sortOrder !== undefined) formData.append("sortOrder", String(data.sortOrder));
    finalBody = formData;
  }
  const response = await fetch(`${API_BASE_URL}/api/admin/products/${productId}/images`, { method: "POST", headers: getAuthHeaders(false), body: finalBody, credentials: "include" });
  if (!response.ok) await handleResponseError(response); return response.ok;
}

export async function deleteProductImage(productId: number | string, imageId: number | string) {
  const response = await fetch(`${API_BASE_URL}/api/admin/products/${productId}/images/${imageId}`, { method: "DELETE", headers: getAuthHeaders(true), credentials: "include" });
  if (!response.ok) await handleResponseError(response); return response.ok;
}

/* =========================================================================
 * 8. 장바구니 (Cart) API
 * ========================================================================= */
export interface CartItemResponse {
  cartItemId: number;
  productId: number;
  productName: string;
  price: number;
  thumbnailUrl?: string | null;
  quantity: number;
}

export interface GuestCartItem {
  cartItemId: number;
  productId: number;
  productName: string;
  price: number;
  thumbnailUrl: string;
  quantity: number;
}

/**
 * 비회원 장바구니 저장소
 *
 * 프로젝트 전체에서 반드시 "guestCart" 하나만 사용한다.
 */
const GUEST_CART_KEY = "guestCart";

/**
 * 비회원 장바구니 조회
 */
export const getGuestCart = (): GuestCartItem[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const stored = localStorage.getItem(GUEST_CART_KEY);

  if (!stored) {
    return [];
  }

  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error("비회원 장바구니 파싱 실패:", error);
    localStorage.removeItem(GUEST_CART_KEY);
    return [];
  }
};

/**
 * 비회원 장바구니 저장
 */
export const setGuestCart = (cart: GuestCartItem[]): void => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
};

/**
 * 비회원 장바구니 삭제
 */
export const clearGuestCart = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(GUEST_CART_KEY);
};

/**
 * 장바구니 조회
 *
 * 유효한 JWT가 있으면 서버 장바구니
 * JWT가 없으면 비회원 장바구니
 */
export const fetchCartItems = async (): Promise<CartItemResponse[]> => {
  const token = getAccessToken();

  if (isAccessTokenValid(token)) {
    const response = await fetch(`${API_BASE_URL}/api/cart`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    if (!response.ok) {
      const error = new Error("장바구니 조회 실패") as Error & {
        status?: number;
      };

      error.status = response.status;

      throw error;
    }

    return response.json();
  }

  return getGuestCart();
};

/**
 * 장바구니 상품 추가
 *
 * 로그인 사용자 → 서버
 * 비회원 → guestCart
 */
export const addCartItem = async (
  product: any,
  quantity: number
): Promise<void> => {
  const token = getAccessToken();

  if (isAccessTokenValid(token)) {
    const response = await fetch(`${API_BASE_URL}/api/cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        productId: product.id,
        quantity,
      }),
      credentials: "include",
    });

    if (!response.ok) {
      const error = new Error(
        "장바구니 담기에 실패했습니다."
      ) as Error & {
        status?: number;
      };

      error.status = response.status;

      throw error;
    }

    return;
  }

  const cart = getGuestCart();

  const existingItemIndex = cart.findIndex(
    (item) => item.productId === product.id
  );

  if (existingItemIndex > -1) {
    cart[existingItemIndex].quantity += quantity;
  } else {
    cart.push({
      cartItemId: Date.now(),
      productId: product.id,
      productName: product.name,
      price: product.price,
      thumbnailUrl: product.thumbnail,
      quantity,
    });
  }

  setGuestCart(cart);
};

/**
 * 서버 장바구니 추가
 *
 * 이 함수는 로그인 사용자 전용 API다.
 */
export async function addToCart(
  productId: number,
  quantity: number = 1
) {
  const token = getAccessToken();

  if (!isAccessTokenValid(token)) {
    throw new Error("로그인이 필요한 기능입니다.");
  }

  const response = await fetch(`${API_BASE_URL}/api/cart`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(true),
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      productId,
      quantity,
    }),
    credentials: "include",
  });

  if (!response.ok) {
    const error = new Error(
      "장바구니 담기에 실패했습니다."
    ) as Error & {
      status?: number;
    };

    error.status = response.status;

    throw error;
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cartChanged"));
  }

  return response.text();
}

/**
 * 로그인 사용자 장바구니 수량 변경
 */
export async function updateCartItemQuantity(
  cartItemId: number,
  quantity: number
) {
  const token = getAccessToken();

  if (!isAccessTokenValid(token)) {
    throw new Error("로그인이 필요한 기능입니다.");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/cart/${cartItemId}?quantity=${quantity}`,
    {
      method: "PUT",
      headers: {
        ...getAuthHeaders(true),
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = new Error(
      "장바구니 수량 변경에 실패했습니다."
    ) as Error & {
      status?: number;
    };

    error.status = response.status;

    throw error;
  }

  return response.text();
}

/**
 * 로그인 사용자 장바구니 상품 삭제
 *
 * 중요:
 * 비회원에서는 이 함수를 호출하면 안 된다.
 * 비회원 장바구니 삭제는 CartPage에서 guestCart를 직접 수정한다.
 */
export async function removeCartItem(cartItemId: number) {
  const token = getAccessToken();

  if (!isAccessTokenValid(token)) {
    throw new Error("로그인이 필요한 기능입니다.");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/cart/${cartItemId}`,
    {
      method: "DELETE",
      headers: {
        ...getAuthHeaders(true),
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = new Error(
      "장바구니 상품 삭제에 실패했습니다."
    ) as Error & {
      status?: number;
    };

    error.status = response.status;

    throw error;
  }

  return response.text();
}

/**
 * 장바구니 수량 조회
 */
export const fetchCartCount = async (): Promise<number> => {
  const token = getAccessToken();

  if (isAccessTokenValid(token)) {
    const response = await fetch(
      `${API_BASE_URL}/api/cart/count`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      return 0;
    }

    return response.json();
  }

  const cart = getGuestCart();

  return cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
};

/**
 * 비회원 장바구니 → 로그인 사용자 장바구니 동기화
 */
export async function syncLocalCartToServer(
  items: GuestCartItem[]
): Promise<void> {
  const token = getAccessToken();

  if (!isAccessTokenValid(token)) {
    return;
  }

  const response = await fetch(
    `${API_BASE_URL}/api/cart/sync`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(items),
    }
  );

  if (!response.ok) {
    throw new Error(
      "장바구니 동기화에 실패했습니다."
    );
  }
}

/* =========================================================================
 * 9. 어드민 고객(Users) 관리 API
 * ========================================================================= */
export interface AdminUserResponse { id: number; email: string; name: string; role: string; joinDate: string; orderCount?: number; totalSpent?: number; }
export interface PaginatedResponse<T> { content: T[]; totalPages: number; totalElements: number; number: number; }

export async function fetchAdminUsers(page: number = 0, size: number = 10, searchName: string = "", tier: string = ""): Promise<PaginatedResponse<AdminUserResponse>> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (searchName) params.append("name", searchName);
  if (tier) params.append("tier", tier);
  const response = await fetch(`${API_BASE_URL}/api/admin/users?${params.toString()}`, { headers: getAuthHeaders(true), credentials: "include" });
  if (!response.ok) await handleResponseError(response); return response.json();
}

export function getCustomerTier(totalSpent: number) {
  if (totalSpent >= 1000000) return "VIP"; if (totalSpent >= 300000) return "GOLD"; if (totalSpent >= 100000) return "SILVER"; return "BRONZE";
}

/* =========================================================================
 * 결제 (Payment) API
 * ========================================================================= */
export const confirmPayment = async (paymentData: { paymentKey: string; orderId: string; amount: number }) => {
  const token = getAccessToken();
  const response = await fetch(`${API_BASE_URL}/api/payments/confirm`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(paymentData) });
  if (!response.ok) throw new Error(await response.text()); return response.json();
};

export interface PaymentHistoryResponse { id: number; orderId: string; paymentKey: string; amount: number; status: string; cancelReason: string | null; createdAt: string; canceledAt: string | null; }

export const fetchPaymentHistory = async (status: "DONE" | "CANCELED"): Promise<PaymentHistoryResponse[]> => {
  const token = getAccessToken();
  if (!token) throw new Error("로그인이 필요합니다.");
  const response = await fetch(`${API_BASE_URL}/api/payments/history?status=${status}`, { method: "GET", headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error("결제 내역을 불러오는데 실패했습니다."); return response.json();
};

/* =========================================================================
 * 10. 커뮤니티 (Community) API
 * ========================================================================= */
export type CommunityCategory = "NOTICE" | "FAQ" | "EVENT" | "QNA" | "TECH"; // TECH(트러블슈팅) 추가

export interface CommunityPostListItem { 
  id: number; 
  title: string; 
  category: CommunityCategory; 
  createdAt: string; 
  author: string; 
  isPinned: boolean; 
  viewCount: number; 
}

export interface CommunityPostDetail extends CommunityPostListItem { 
  content: string; 
  // --- TECH(트러블슈팅) 전용 선택적 필드 (일반 글에서는 undefined 또는 null) ---
  occurrenceDate?: string;
  status?: string;
  severity?: string;
  techStack?: string;
  errorMessage?: string;
  situation?: string;
}

// 폼(Form)에서 전송할 페이로드 타입 정의 (타입 안정성 확보)
export interface CommunityPostCreatePayload {
  category: CommunityCategory;
  title: string;
  content: string;
  author?: string;
  isPinned?: boolean;
  occurrenceDate?: string;
  status?: string;
  severity?: string;
  techStack?: string;
  errorMessage?: string;
  situation?: string;
}

// 💡 작성 API의 경우 관리자 권한으로 변경 (/admin/community/posts)
export const createCommunityPost = async (data: CommunityPostCreatePayload) => {
  const response = await fetch(`${API_BASE_URL}/api/admin/community/posts`, { 
    method: "POST", 
    headers: getAuthHeaders(true), // Content-Type: application/json 등 포함되어 있다고 가정
    body: JSON.stringify(data), 
    credentials: "include" 
  });
  if (!response.ok) await handleResponseError(response); 
  return response.json();
};

export const updateCommunityPost = async (id: number | string, data: CommunityPostCreatePayload) => {
  const response = await fetch(`${API_BASE_URL}/api/admin/community/posts/${id}`, { 
    method: "PUT", 
    headers: getAuthHeaders(true), 
    body: JSON.stringify(data), 
    credentials: "include" 
  });
  if (!response.ok) await handleResponseError(response); 
  return response.json();
};

export const fetchCommunityPost = async (id: string | number): Promise<CommunityPostDetail> => {
  const response = await fetch(`${API_BASE_URL}/api/community/posts/${id}`);
  if (!response.ok) await handleResponseError(response); 
  return response.json();
};

export const fetchCommunityPosts = async (category?: string): Promise<CommunityPostListItem[]> => {
  const url = category ? `${API_BASE_URL}/api/community/posts?category=${encodeURIComponent(category)}` : `${API_BASE_URL}/api/community/posts`;
  const response = await fetch(url);
  if (!response.ok) await handleResponseError(response); 
  return response.json();
};

export async function deleteCommunityPost(id: string | number): Promise<void> {
  // getAuthHeaders(true)는 어제 만드신 토큰 헤더 반환 함수입니다.
  const response = await fetch(`${API_BASE_URL}/api/admin/community/posts/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(true), 
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(errorData || "게시글 삭제에 실패했습니다.");
  }
}