// src/lib/api.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

/* =========================================================================
 * 0. 메모리 토큰 저장소 및 헬퍼 함수
 * ========================================================================= */
let inMemoryAccessToken: string | null = null;

// 💡 1. 토큰을 바깥에서 읽을 수 있게 해주는 함수 추가
export const getAccessToken = () => inMemoryAccessToken;

export const setAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;
  
  // 💡 2. 토큰이 바뀔 때마다 브라우저에 커스텀 이벤트를 방송합니다.
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("authStateChanged"));
  }
};

const getAuthHeaders = (isJson: boolean = true): HeadersInit => {
  const headers: Record<string, string> = {};
  if (isJson) headers["Content-Type"] = "application/json";
  
  if (inMemoryAccessToken) {
    headers["Authorization"] = `Bearer ${inMemoryAccessToken}`;
  }
  return headers;
};

async function handleResponseError(response: Response): Promise<never> {
  if (response.status === 401) throw new Error("인증이 필요하거나 세션이 만료되었습니다.");
  if (response.status === 403) throw new Error("해당 작업을 수행할 권한이 없습니다.");

  let errorMessage = "요청 처리 중 오류가 발생했습니다.";
  try {
    const errorData = await response.json();
    errorMessage = errorData.message || errorMessage;
  } catch {
    const textError = await response.text();
    if (textError) errorMessage = textError;
  }
  throw new Error(errorMessage);
}

export function resolveAssetUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_BASE_URL}${path}`;
}

/* =========================================================================
 * 1. 이력서 (Resume) 관련 타입
 * ========================================================================= */
export interface ResumeProfile { 
  id?: number; 
  name: string; 
  jobTitle?: string; 
  githubUrl?: string; 
  shortIntro?: string; 
  email?: string; 
  phone?: string; // 💡 컴포넌트 요구사항 추가
  profileImage?: string; 
}
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
  thumbnail?: string | null; // 💡 thumbnailUrl -> thumbnail로 통일
  status: ProjectStatus;
  isFeatured: boolean;
  sortOrder: number;
  startDate?: string | null; // 💡 DB 반영
  endDate?: string | null;   // 💡 DB 반영
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
}

/* =========================================================================
 * 3. 상품 (Product) 관련 타입
 * ========================================================================= */
export interface ProductListResponse {
  id: number;
  name: string;
  price: number;
  originalPrice?: number | null;
  thumbnail?: string | null;
  isNew?: boolean;
  isBest?: boolean;
  category?: string | null;
}

export interface ProductImage {
  id: number;
  imageUrl?: string;
  imageType?: "MAIN" | "THUMBNAIL" | "DETAIL" | string;
  altText?: string | null; // 💡 컴포넌트 요구사항
  sortOrder: number;
}

export interface ProductDetailInfo {
  description?: string;
  shortDescription?: string;
  usageInfo?: string;
  ingredients?: string;
  productInfo?: string;
}

export interface ProductColor {
  id: number;
  colorName: string;
  colorCode: string;
}

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
}

/* =========================================================================
 * 4. 인증(Auth) API
 * ========================================================================= */
export async function signupUser(userData: { email: string; password: string; name?: string }) {
  const response = await fetch(`${API_BASE_URL}/api/users/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  if (!response.ok) await handleResponseError(response);
  return response.text();
}

export async function loginUser(credentials: { email: string; password: string }) {
  const response = await fetch(`${API_BASE_URL}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
    credentials: "include", 
  });
  if (!response.ok) await handleResponseError(response);
  const data = await response.json();
  setAccessToken(data.accessToken); 
  return data;
}

export async function silentRefresh() {
  const response = await fetch(`${API_BASE_URL}/api/users/refresh`, {
    method: "POST",
    credentials: "include", 
  });
  if (!response.ok) {
    setAccessToken(null);
    throw new Error("세션이 만료되었습니다.");
  }
  const data = await response.json();
  setAccessToken(data.accessToken);
  return data.accessToken;
}

export async function logoutUser() {
  try {
    await fetch(`${API_BASE_URL}/api/users/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch (e) {} finally { setAccessToken(null); }
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
    method: "PUT",
    headers: getAuthHeaders(!isFormData),
    body: isFormData ? profileData : JSON.stringify(profileData),
    credentials: "include",
  });
  if (!response.ok) await handleResponseError(response);
  return response.ok;
}

// [Education]
export async function createResumeEducation(data: any) {
  const response = await fetch(`${API_BASE_URL}/api/admin/resume/educations`, { method: "POST", headers: getAuthHeaders(true), body: JSON.stringify(data), credentials: "include" });
  if (!response.ok) await handleResponseError(response); return response.ok;
}
export async function updateResumeEducation(id: number, data: any) {
  const response = await fetch(`${API_BASE_URL}/api/admin/resume/educations/${id}`, { method: "PUT", headers: getAuthHeaders(true), body: JSON.stringify(data), credentials: "include" });
  if (!response.ok) await handleResponseError(response); return response.ok;
}
export async function deleteResumeEducation(id: number) {
  const response = await fetch(`${API_BASE_URL}/api/admin/resume/educations/${id}`, { method: "DELETE", headers: getAuthHeaders(true), credentials: "include" });
  if (!response.ok) await handleResponseError(response); return response.ok;
}

// [Experience]
export async function createResumeExperience(data: any) {
  const response = await fetch(`${API_BASE_URL}/api/admin/resume/experiences`, { method: "POST", headers: getAuthHeaders(true), body: JSON.stringify(data), credentials: "include" });
  if (!response.ok) await handleResponseError(response); return response.ok;
}
export async function updateResumeExperience(id: number, data: any) {
  const response = await fetch(`${API_BASE_URL}/api/admin/resume/experiences/${id}`, { method: "PUT", headers: getAuthHeaders(true), body: JSON.stringify(data), credentials: "include" });
  if (!response.ok) await handleResponseError(response); return response.ok;
}
export async function deleteResumeExperience(id: number) {
  const response = await fetch(`${API_BASE_URL}/api/admin/resume/experiences/${id}`, { method: "DELETE", headers: getAuthHeaders(true), credentials: "include" });
  if (!response.ok) await handleResponseError(response); return response.ok;
}

// [Skill]
export async function createResumeSkill(data: any) {
  const response = await fetch(`${API_BASE_URL}/api/admin/resume/skills`, { method: "POST", headers: getAuthHeaders(true), body: JSON.stringify(data), credentials: "include" });
  if (!response.ok) await handleResponseError(response); return response.ok;
}
export async function updateResumeSkill(id: number, data: any) {
  const response = await fetch(`${API_BASE_URL}/api/admin/resume/skills/${id}`, { method: "PUT", headers: getAuthHeaders(true), body: JSON.stringify(data), credentials: "include" });
  if (!response.ok) await handleResponseError(response); return response.ok;
}
export async function deleteResumeSkill(id: number) {
  const response = await fetch(`${API_BASE_URL}/api/admin/resume/skills/${id}`, { method: "DELETE", headers: getAuthHeaders(true), credentials: "include" });
  if (!response.ok) await handleResponseError(response); return response.ok;
}

// [Introduction]
export async function createResumeIntroduction(data: any) {
  const response = await fetch(`${API_BASE_URL}/api/admin/resume/introductions`, { method: "POST", headers: getAuthHeaders(true), body: JSON.stringify(data), credentials: "include" });
  if (!response.ok) await handleResponseError(response); return response.ok;
}
export async function updateResumeIntroduction(id: number, data: any) {
  const response = await fetch(`${API_BASE_URL}/api/admin/resume/introductions/${id}`, { method: "PUT", headers: getAuthHeaders(true), body: JSON.stringify(data), credentials: "include" });
  if (!response.ok) await handleResponseError(response); return response.ok;
}
export async function deleteResumeIntroduction(id: number) {
  const response = await fetch(`${API_BASE_URL}/api/admin/resume/introductions/${id}`, { method: "DELETE", headers: getAuthHeaders(true), credentials: "include" });
  if (!response.ok) await handleResponseError(response); return response.ok;
}

/* =========================================================================
 * 6. 프로젝트 (Project & Media) API
 * ========================================================================= */
export async function fetchProjects(isFeatured?: boolean): Promise<PortfolioProject[]> {
  const url = isFeatured ? `${API_BASE_URL}/api/projects?featured=true` : `${API_BASE_URL}/api/projects`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("프로젝트 데이터를 불러오는데 실패했습니다.");
  return response.json();
}

export async function fetchProject(projectId: number | string): Promise<PortfolioProject> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`);
  if (!response.ok) await handleResponseError(response);
  return response.json();
}

export async function createProject(projectData: any) {
  const isFormData = typeof FormData !== "undefined" && projectData instanceof FormData;
  const response = await fetch(`${API_BASE_URL}/api/admin/projects`, { method: "POST", headers: getAuthHeaders(!isFormData), body: isFormData ? projectData : JSON.stringify(projectData), credentials: "include" });
  if (!response.ok) await handleResponseError(response); return response.json();
}

export async function updateProject(projectId: number | string, projectData: any) {
  const isFormData = typeof FormData !== "undefined" && projectData instanceof FormData;
  const response = await fetch(`${API_BASE_URL}/api/admin/projects/${projectId}`, { method: "PUT", headers: getAuthHeaders(!isFormData), body: isFormData ? projectData : JSON.stringify(projectData), credentials: "include" });
  if (!response.ok) await handleResponseError(response); return response.ok;
}

export async function deleteProject(projectId: number | string) {
  const response = await fetch(`${API_BASE_URL}/api/admin/projects/${projectId}`, { method: "DELETE", headers: getAuthHeaders(true), credentials: "include" });
  if (!response.ok) await handleResponseError(response); return response.text();
}

// [Project Media]
export async function fetchProjectMedia(projectId: number | string): Promise<ProjectMedia[]> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/media`);
  if (!response.ok) await handleResponseError(response); return response.json();
}
export async function createProjectMedia(projectId: number | string, data: any) {
  const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
  const response = await fetch(`${API_BASE_URL}/api/admin/projects/${projectId}/media`, { method: "POST", headers: getAuthHeaders(!isFormData), body: isFormData ? data : JSON.stringify(data), credentials: "include" });
  if (!response.ok) await handleResponseError(response); return response.ok;
}
export async function updateProjectMedia(projectId: number | string, mediaId: number | string, data: any) {
  const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
  const response = await fetch(`${API_BASE_URL}/api/admin/projects/${projectId}/media/${mediaId}`, { method: "PUT", headers: getAuthHeaders(!isFormData), body: isFormData ? data : JSON.stringify(data), credentials: "include" });
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
  const url = category 
    ? `${API_BASE_URL}/api/products?category=${encodeURIComponent(category)}`
    : `${API_BASE_URL}/api/products`;
    
  const response = await fetch(url);
  if (!response.ok) await handleResponseError(response); 
  return response.json();
}

export async function getProductById(productId: number | string): Promise<ProductDetailResponse> {
  const response = await fetch(`${API_BASE_URL}/api/products/${productId}`);
  if (!response.ok) await handleResponseError(response); return response.json();
}

// [Shop Admin]
export async function fetchAdminProducts(): Promise<AdminProduct[]> {
  const response = await fetch(`${API_BASE_URL}/api/admin/products`, { headers: getAuthHeaders(true), credentials: "include" });
  if (!response.ok) await handleResponseError(response); return response.json();
}

export async function createProduct(productData: any) {
  const isFormData = typeof FormData !== "undefined" && productData instanceof FormData;
  const response = await fetch(`${API_BASE_URL}/api/admin/products`, { method: "POST", headers: getAuthHeaders(!isFormData), body: isFormData ? productData : JSON.stringify(productData), credentials: "include" });
  if (!response.ok) await handleResponseError(response); return response.json(); // 생성 후 객체반환 처리 지원
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

// [Product Images]
export async function fetchProductImages(productId: number | string): Promise<ProductImage[]> {
  const response = await fetch(`${API_BASE_URL}/api/products/${productId}/images`);
  if (!response.ok) await handleResponseError(response); return response.json();
}
export async function uploadProductImage(productId: number | string, data: any) {
  // formData 인자 지원을 유연하게 처리
  const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
  
  // 컴포넌트에서 객체 리터럴 형태로 넘길경우 FormData로 변환하는 방어로직 추가
  let finalBody = data;
  if (!isFormData && data.file) {
    const formData = new FormData();
    formData.append("file", data.file);
    if(data.imageType) formData.append("imageType", data.imageType);
    if(data.altText) formData.append("altText", data.altText);
    if(data.sortOrder !== undefined) formData.append("sortOrder", String(data.sortOrder));
    finalBody = formData;
  }

  const response = await fetch(`${API_BASE_URL}/api/admin/products/${productId}/images`, { 
    method: "POST", 
    headers: getAuthHeaders(false), 
    body: finalBody, 
    credentials: "include" 
  });
  if (!response.ok) await handleResponseError(response); 
  return response.ok;
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

// 1. 내 장바구니 조회
export async function fetchCartItems(): Promise<CartItemResponse[]> {
  const response = await fetch(`${API_BASE_URL}/api/cart`, {
    method: "GET",
    headers: getAuthHeaders(true),
    credentials: "include",
  });
  if (!response.ok) await handleResponseError(response);
  return response.json();
}

// 2. 장바구니에 담기
export async function addToCart(productId: number, quantity: number = 1) {
  const response = await fetch(`${API_BASE_URL}/api/cart`, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: JSON.stringify({ productId, quantity }),
    credentials: "include",
  });
  if (!response.ok) await handleResponseError(response);
  return response.text();
}

// 3. 수량 변경
export async function updateCartItemQuantity(cartItemId: number, quantity: number) {
  const response = await fetch(`${API_BASE_URL}/api/cart/${cartItemId}?quantity=${quantity}`, {
    method: "PUT",
    headers: getAuthHeaders(true),
    credentials: "include",
  });
  if (!response.ok) await handleResponseError(response);
  return response.text();
}

// 4. 상품 삭제
export async function removeCartItem(cartItemId: number) {
  const response = await fetch(`${API_BASE_URL}/api/cart/${cartItemId}`, {
    method: "DELETE",
    headers: getAuthHeaders(true),
    credentials: "include",
  });
  if (!response.ok) await handleResponseError(response);
  return response.text();
}