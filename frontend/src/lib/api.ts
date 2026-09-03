// src/lib/api.ts
const IS_SERVER = typeof window === "undefined";

const API_BASE_URL = IS_SERVER
  ? (process.env.INTERNAL_API_URL || "http://backend-api:8080")
  : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080");

/* =========================================================================
 * 0. 메모리 토큰 저장소 및 헬퍼 함수
 * ========================================================================= */
let inMemoryAccessToken: string | null = null;

export const getAccessToken = () => inMemoryAccessToken;

export const setAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;
  if (typeof window !== "undefined") {
    // 💡 토큰이 세팅되거나 지워질 때마다 브라우저에 '상태 변경' 이벤트를 날립니다.
    window.dispatchEvent(new Event("authStateChanged"));
  }
};

export const removeAccessToken = () => {
  // 1. 메모리 상의 토큰을 날려버립니다. (가장 중요)
  inMemoryAccessToken = null;
  
  if (typeof window !== "undefined") {
    // 2. 토큰이 지워졌다는 이벤트를 날려 프론트엔드 헤더가 즉각 반응하게 합니다.
    window.dispatchEvent(new Event("authStateChanged"));
    
    // 3. (선택) 혹시 예전에 쓰던 로컬스토리지 찌꺼기가 남아있을까봐 확실하게 청소합니다.
    localStorage.removeItem("accessToken"); 
  }
};

const getAuthHeaders = (isJson: boolean = true): HeadersInit => {
  const headers: Record<string, string> = {};
  if (isJson) headers["Content-Type"] = "application/json";
  if (inMemoryAccessToken) headers["Authorization"] = `Bearer ${inMemoryAccessToken}`;
  return headers;
};

export async function handleResponseError(response: Response) {
  // 1. 스트림을 딱 한 번만 텍스트로 읽음
  const errorText = await response.clone().text();
  let errorMessage = "요청 처리에 실패했습니다.";

  try {
    const errorJson = JSON.parse(errorText);
    errorMessage = errorJson.message || errorMessage;
  } catch {
    errorMessage = errorText;
  }

  // 4. 반드시 Error를 throw하여 loginUser 함수의 남은 로직이 실행되지 않도록 차단
  throw new Error(errorMessage);
}

export function resolveAssetUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const PUBLIC_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
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

export async function loginUser(credentials: { email: string; password: string }) {
  const response = await fetch(`${API_BASE_URL}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
    credentials: "include", 
  });

  // 1. 상태가 200번대(성공)가 아니면 에러 처리
  if (!response.ok) {
    // 백엔드가 JSON이 아닌 텍스트로 보냈으므로 text()로 읽음
    const errorText = await response.text(); 
    // 그 텍스트 그대로 에러를 발생시켜 로그인 컴포넌트의 catch로 던짐
    throw new Error(errorText); 
  }

  // 2. 성공했을 때만 JSON으로 파싱
  const data = await response.json();
  setAccessToken(data.accessToken); 
  return data;
}

export async function silentRefresh() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/refresh`, { 
      method: "POST", 
      credentials: "include" 
    });
    
    // 401 에러(비로그인)가 뜨면 에러를 던지지(throw) 않고 조용히 null을 반환
    if (!response.ok) { 
      setAccessToken(null); 
      return null; 
    }
    
    const data = await response.json();
    setAccessToken(data.accessToken); 
    return data.accessToken;
  } catch (error) {
    // 서버가 꺼져있거나 네트워크 에러 시에도 조용히 처리
    setAccessToken(null);
    return null;
  }
}

export async function logoutUser() {
  try { await fetch(`${API_BASE_URL}/api/users/logout`, { method: "POST", credentials: "include" }); } 
  catch (e) {} finally { setAccessToken(null); }
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
export interface CartItemResponse { cartItemId: number; productId: number; productName: string; price: number; thumbnailUrl?: string | null; quantity: number; }
export interface GuestCartItem { cartItemId: number; productId: number; productName: string; price: number; thumbnailUrl: string; quantity: number; }

export const fetchCartItems = async () => {
  const token = getAccessToken();
  if (token) {
    const response = await fetch(`${API_BASE_URL}/api/cart`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error("장바구니 조회 실패"); return response.json();
  } else {
    const guestCart = localStorage.getItem("guestCart"); return guestCart ? JSON.parse(guestCart) : [];
  }
};

export const addCartItem = async (product: any, quantity: number) => {
  const token = getAccessToken();
  if (token) {
    const response = await fetch(`${API_BASE_URL}/api/cart`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ productId: product.id, quantity }) });
    if (!response.ok) throw new Error("장바구니 담기에 실패했습니다.");
  } else {
    const existingCart = localStorage.getItem("guestCart"); let cart: GuestCartItem[] = existingCart ? JSON.parse(existingCart) : [];
    const existingItemIndex = cart.findIndex(item => item.productId === product.id);
    if (existingItemIndex > -1) { cart[existingItemIndex].quantity += quantity; } 
    else { cart.push({ cartItemId: Date.now(), productId: product.id, productName: product.name, price: product.price, thumbnailUrl: product.thumbnail, quantity: quantity }); }
    localStorage.setItem("guestCart", JSON.stringify(cart));
  }
};

export async function addToCart(productId: number, quantity: number = 1) {
  const response = await fetch(`${API_BASE_URL}/api/cart`, { 
    method: "POST", headers: getAuthHeaders(true), body: JSON.stringify({ productId, quantity }), credentials: "include" 
  });
  if (!response.ok) await handleResponseError(response); 
  
  // 💡 물건 담기 성공 시 헤더에게 "장바구니 업데이트해!" 라고 알림
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cartChanged"));
  }
  return response.text();
}

export async function updateCartItemQuantity(cartItemId: number, quantity: number) {
  const response = await fetch(`${API_BASE_URL}/api/cart/${cartItemId}?quantity=${quantity}`, { method: "PUT", headers: getAuthHeaders(true), credentials: "include" });
  if (!response.ok) await handleResponseError(response); return response.text();
}

export async function removeCartItem(cartItemId: number) {
  const response = await fetch(`${API_BASE_URL}/api/cart/${cartItemId}`, { method: "DELETE", headers: getAuthHeaders(true), credentials: "include" });
  if (!response.ok) await handleResponseError(response); return response.text();
}

export const fetchCartCount = async () => {
  const token = getAccessToken();
  
  if (token) {
    // 로그인 유저: 수량 전용 API 호출
    const response = await fetch(`${API_BASE_URL}/api/cart/count`, { 
      headers: { Authorization: `Bearer ${token}` } 
    });
    if (!response.ok) return 0;
    return response.json(); // 숫자만 반환됨
  } else {
    // 비로그인 유저: 로컬 스토리지에서 즉시 계산
    const guestCart = localStorage.getItem("guestCart"); 
    if (!guestCart) return 0;
    
    const cart: GuestCartItem[] = JSON.parse(guestCart);
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }
};

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