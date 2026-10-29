import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import { addGuestLine, recoverGuestCart, type GuestLineInput } from "./guestCart.ts";

const IS_SERVER = typeof window === "undefined";

// 💡 수정된 API_BASE_URL 설정
const API_BASE_URL = IS_SERVER
  // 서버(SSR)일 때: 각 환경(.env)에 맞는 내부 주소 사용
  ? (process.env.INTERNAL_API_URL || "http://localhost:8080")
  
  // 브라우저일 때: 각 환경(.env)에 맞는 외부 주소 사용
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

let rememberedSession = false;
let settledGuest = false;

export const setAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;
  if (token && getAccessTokenPayload(token)?.role && getAccessTokenPayload(token)?.tokenType !== "refresh") {
    rememberedSession = true;
    settledGuest = false;
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("authStateChanged"));
  }
};

export interface AccessTokenPayload {
  sub?: string;
  role?: string;
  exp?: number;
  tokenType?: string;
}

export const getAccessTokenPayload = (
  token: string | null = inMemoryAccessToken
): AccessTokenPayload | null => {
  if (!token) {
    return null;
  }

  try {
    return jwtDecode<AccessTokenPayload>(token);
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

  if (!payload?.exp || !payload.role || payload.tokenType === "refresh") {
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

  return payload.role === "ROLE_ADMIN" || payload.role === "ADMIN";
};

/**
 * Access Token 제거
 */
export const removeAccessToken = () => {
  inMemoryAccessToken = null;
  rememberedSession = false;
  settledGuest = false;

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("authStateChanged"));

    // 과거 버전에서 사용했던 accessToken 찌꺼기 제거
    localStorage.removeItem("accessToken");
  }
};

export async function handleResponseError(response: Response) {
  const errorText = await response.clone().text();

  let errorMessage = "요청 처리에 실패했습니다.";

  try {
    const errorJson = JSON.parse(errorText);
    const fieldText = errorJson.fields
      ? Object.entries(errorJson.fields)
          .map(([field, message]) => `${field}: ${message}`)
          .join("\n")
      : "";
    errorMessage = errorJson.message || errorJson.error || errorMessage;
    if (fieldText) {
      errorMessage = `${errorMessage}\n${fieldText}`;
    }
  } catch {
    errorMessage = errorText || errorMessage;
  }

  const kind = response.status === 401
    ? "unauthenticated"
    : response.status === 403
      ? "forbidden"
      : "failed";
  throw new ApiRequestError(errorMessage, kind, response.status);
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

export type AuthPhase = "checking" | "authenticated" | "guest" | "recovery_failed";

export type AuthResolution = {
  phase: Exclude<AuthPhase, "checking">;
  token: string | null;
  message: string;
};

export class ApiRequestError extends Error {
  readonly kind: "unauthenticated" | "forbidden" | "recovery_failed" | "network" | "failed";
  readonly status: number | null;

  constructor(message: string, kind: ApiRequestError["kind"], status: number | null = null) {
    super(message);
    this.name = "ApiRequestError";
    this.kind = kind;
    this.status = status;
  }
}

type RefreshOutcome =
  | { phase: "authenticated"; token: string }
  | { phase: "guest" }
  | { phase: "discarded" }
  | { phase: "recovery_failed"; message: string };

export type LogoutResult = "revoked" | "incomplete" | "local_only" | "failed";

let authPhase: AuthPhase = "guest";
let refreshInFlight: Promise<RefreshOutcome> | null = null;
let authGeneration = 0;

export function getAuthPhase(): AuthPhase {
  return authPhase;
}

async function requestRefresh(): Promise<RefreshOutcome> {
  if (typeof window === "undefined") {
    return { phase: "recovery_failed", message: "인증 복구는 브라우저에서만 실행합니다." };
  }
  const generation = authGeneration;
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (generation !== authGeneration) {
      return { phase: "discarded" };
    }
    if (response.status === 401) {
      setAccessToken(null);
      return { phase: "guest" };
    }
    if (response.status === 403) {
      return { phase: "recovery_failed", message: "인증을 갱신할 권한이 없습니다." };
    }
    if (!response.ok) {
      return { phase: "recovery_failed", message: "로그인 상태를 복구하지 못했습니다." };
    }
    const data = await response.json() as { accessToken?: string };
    if (generation !== authGeneration) {
      return { phase: "discarded" };
    }
    if (!data.accessToken || !isAccessTokenValid(data.accessToken)) {
      setAccessToken(null);
      return { phase: "recovery_failed", message: "복구된 액세스 토큰이 유효하지 않습니다." };
    }
    setAccessToken(data.accessToken);
    if (generation !== authGeneration) {
      removeAccessToken();
      return { phase: "discarded" };
    }
    return { phase: "authenticated", token: data.accessToken };
  } catch (error) {
    console.error("[REFRESH] 요청 예외:", error);
    if (generation !== authGeneration) {
      return { phase: "discarded" };
    }
    return { phase: "recovery_failed", message: "로그인 상태 복구 요청이 완료되지 않았습니다." };
  }
}

export function silentRefresh(): Promise<RefreshOutcome> {
  if (!refreshInFlight) {
    refreshInFlight = requestRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export async function resolveAuthState(): Promise<AuthResolution> {
  if (typeof window === "undefined") {
    const current = getAccessToken();
    if (isAccessTokenValid(current)) {
      authPhase = "authenticated";
      return { phase: "authenticated", token: current, message: "" };
    }
    authPhase = "recovery_failed";
    return { phase: "recovery_failed", token: null, message: "브라우저에서 다시 로그인해 주세요." };
  }

  const current = getAccessToken();
  if (isAccessTokenValid(current)) {
    rememberedSession = true;
    settledGuest = false;
    authPhase = "authenticated";
    return { phase: "authenticated", token: current, message: "" };
  }
  if (!current && !rememberedSession && settledGuest) {
    authPhase = "guest";
    return { phase: "guest", token: null, message: "" };
  }

  const hadSession = rememberedSession || Boolean(current);
  authPhase = "checking";
  const outcome = await silentRefresh();
  if (outcome.phase === "discarded") {
    const phaseAfterLogout = getAuthPhase();
    if (phaseAfterLogout === "recovery_failed") {
      return { phase: "recovery_failed", token: null, message: "로그아웃 상태를 확인하지 못했습니다. 다시 로그인해 주세요." };
    }
    if (phaseAfterLogout === "checking") {
      authPhase = "guest";
      settledGuest = true;
    }
    return { phase: "guest", token: null, message: "" };
  }
  if (outcome.phase === "authenticated") {
    authPhase = "authenticated";
    return { phase: "authenticated", token: outcome.token, message: "" };
  }
  if (hadSession || outcome.phase === "recovery_failed") {
    authPhase = "recovery_failed";
    const message = hadSession && outcome.phase === "guest"
      ? "로그인이 만료되었습니다. 다시 로그인해 주세요."
      : outcome.phase === "recovery_failed"
        ? outcome.message
        : "로그인 상태를 확인하지 못했습니다.";
    return { phase: "recovery_failed", token: null, message };
  }
  settledGuest = true;
  authPhase = "guest";
  return { phase: "guest", token: null, message: "" };
}

export async function ensureAccessToken(): Promise<string | null> {
  const auth = await resolveAuthState();
  return auth.phase === "authenticated" ? auth.token : null;
}

const SAFE_RETRY_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export async function authorizedFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const auth = await resolveAuthState();
  if (auth.phase !== "authenticated" || !auth.token) {
    throw new ApiRequestError(
      auth.phase === "guest" ? "로그인이 필요한 기능입니다." : auth.message,
      auth.phase === "guest" ? "unauthenticated" : "recovery_failed",
    );
  }

  const method = (init.method ?? "GET").toUpperCase();
  const send = (token: string) => {
    const headers = new Headers(init.headers);
    if (typeof FormData !== "undefined" && init.body instanceof FormData) {
      headers.delete("Content-Type");
    } else if (typeof init.body === "string" && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    headers.set("Authorization", `Bearer ${token}`);
    return fetch(url, { ...init, headers, credentials: "include" });
  };

  let response: Response;
  try {
    response = await send(auth.token);
  } catch {
    throw new ApiRequestError(
      "요청이 완료됐는지 확인하지 못했습니다. 변경 내용은 자동으로 다시 보내지 않습니다.",
      "network",
    );
  }
  if (response.status === 403) {
    throw new ApiRequestError("이 작업을 수행할 권한이 없습니다.", "forbidden");
  }
  if (response.status !== 401) {
    return response;
  }

  const refreshed = await silentRefresh();
  if (refreshed.phase !== "authenticated") {
    authPhase = "recovery_failed";
    throw new ApiRequestError("로그인이 만료되었습니다. 다시 로그인해 주세요.", "unauthenticated");
  }
  if (!SAFE_RETRY_METHODS.has(method)) {
    throw new ApiRequestError(
      "로그인이 만료되어 요청이 처리되지 않았습니다. 같은 작업은 다시 시도해 주세요.",
      "unauthenticated",
    );
  }
  try {
    response = await send(refreshed.token);
  } catch {
    throw new ApiRequestError(
      "요청이 완료됐는지 확인하지 못했습니다. 변경 내용은 자동으로 다시 보내지 않습니다.",
      "network",
    );
  }
  if (response.status === 403) {
    throw new ApiRequestError("이 작업을 수행할 권한이 없습니다.", "forbidden");
  }
  if (response.status === 401) {
    throw new ApiRequestError("로그인이 필요합니다.", "unauthenticated");
  }
  return response;
}

async function authSend(path: string, method: string, body?: BodyInit | null): Promise<Response> {
  const response = await authorizedFetch(`${API_BASE_URL}${path}`, {
    method,
    body: body ?? undefined,
  });
  if (!response.ok) {
    await handleResponseError(response);
  }
  return response;
}

export async function logoutUser(): Promise<LogoutResult> {
  authGeneration += 1;
  const generation = authGeneration;
  removeAccessToken();
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/logout`, {
      method: "POST",
      credentials: "include",
    });
    if (generation !== authGeneration) {
      return "failed";
    }
    if (response.status === 503) {
      authPhase = "recovery_failed";
      return "incomplete";
    }
    if (!response.ok) {
      authPhase = "recovery_failed";
      return "failed";
    }
    const data = await response.json() as { status?: string };
    if (data.status === "revoked") {
      authPhase = "guest";
      settledGuest = true;
      rememberedSession = false;
      return "revoked";
    }
    authPhase = "recovery_failed";
    return data.status === "local_only" ? "local_only" : "failed";
  } catch {
    if (generation === authGeneration) {
      authPhase = "recovery_failed";
    }
    return "failed";
  }
}

// 1. 인증 코드 발송
export async function sendPasswordResetCode(email: string) {
  const response = await fetch(`${API_BASE_URL}/api/users/password/send-code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "이메일 발송에 실패했습니다.");
  }

  return response.text(); // 백엔드에서 내려주는 성공 메시지 반환
}

// 2. 인증 코드 검증 (선택적)
export async function verifyPasswordResetCode(email: string, code: string) {
  const response = await fetch(`${API_BASE_URL}/api/users/password/verify-code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, code }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "인증 코드가 일치하지 않습니다.");
  }

  return response.text();
}

// 3. 비밀번호 재설정 (최종)
export type PasswordResetResult = {
  status: "complete" | "cleanup_incomplete";
  message: string;
};

export async function resetPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<PasswordResetResult> {
  const response = await fetch(`${API_BASE_URL}/api/users/password/reset`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, code, newPassword }),
  });
  const message = await response.text();
  if (response.status === 503) {
    return {
      status: "cleanup_incomplete",
      message: message || "비밀번호는 변경되었습니다. 이전 로그인은 더 이상 갱신할 수 없습니다. 다시 로그인해 주세요.",
    };
  }
  if (!response.ok) {
    throw new Error(message || "비밀번호 변경에 실패했습니다.");
  }
  return { status: "complete", message: message || "비밀번호가 변경되었습니다. 새로운 비밀번호로 로그인해 주세요." };
}

/* =========================================================================
 * 5. 이력서 (Resume) API
 * ========================================================================= */
export async function fetchResume(): Promise<ResumeData> {
  const response = await fetch(`${API_BASE_URL}/api/resume`);
  if (!response.ok) throw new Error("이력서 데이터를 불러오는데 실패했습니다.");
  return response.json();
}

export async function updateResumeProfile(profileData: FormData | ResumeProfile) {
  const isFormData = typeof FormData !== "undefined" && profileData instanceof FormData;
  await authSend("/api/admin/resume/profile", "PUT", isFormData ? profileData : JSON.stringify(profileData));
  return true;
}

export async function createResumeEducation(data: Omit<ResumeEducation, "id">) { await authSend("/api/admin/resume/educations", "POST", JSON.stringify(data)); return true; }
export async function updateResumeEducation(id: number, data: Omit<ResumeEducation, "id">) { await authSend(`/api/admin/resume/educations/${id}`, "PUT", JSON.stringify(data)); return true; }
export async function deleteResumeEducation(id: number) { await authSend(`/api/admin/resume/educations/${id}`, "DELETE"); return true; }

export async function createResumeExperience(data: Omit<ResumeExperience, "id">) { await authSend("/api/admin/resume/experiences", "POST", JSON.stringify(data)); return true; }
export async function updateResumeExperience(id: number, data: Omit<ResumeExperience, "id">) { await authSend(`/api/admin/resume/experiences/${id}`, "PUT", JSON.stringify(data)); return true; }
export async function deleteResumeExperience(id: number) { await authSend(`/api/admin/resume/experiences/${id}`, "DELETE"); return true; }

export async function createResumeSkill(data: Omit<ResumeSkill, "id">) { await authSend("/api/admin/resume/skills", "POST", JSON.stringify(data)); return true; }
export async function updateResumeSkill(id: number, data: Omit<ResumeSkill, "id">) { await authSend(`/api/admin/resume/skills/${id}`, "PUT", JSON.stringify(data)); return true; }
export async function deleteResumeSkill(id: number) { await authSend(`/api/admin/resume/skills/${id}`, "DELETE"); return true; }

export async function createResumeIntroduction(data: Omit<ResumeIntroduction, "id">) { await authSend("/api/admin/resume/introductions", "POST", JSON.stringify(data)); return true; }
export async function updateResumeIntroduction(id: number, data: Omit<ResumeIntroduction, "id">) { await authSend(`/api/admin/resume/introductions/${id}`, "PUT", JSON.stringify(data)); return true; }
export async function deleteResumeIntroduction(id: number) { await authSend(`/api/admin/resume/introductions/${id}`, "DELETE"); return true; }

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
export interface ProjectMediaUpload {
  file: File;
  caption?: string;
  description?: string;
  altText?: string;
  sortOrder?: number;
}

export interface ProjectMediaUpdate {
  caption?: string | null;
  description?: string;
  altText?: string | null;
  sortOrder?: number;
}

export async function createProject(projectData: ProjectRequest | FormData): Promise<PortfolioProject> {
  const isFormData = typeof FormData !== "undefined" && projectData instanceof FormData;
  const response = await authSend("/api/admin/projects", "POST", isFormData ? projectData : JSON.stringify(projectData));
  return response.json();
}

export async function updateProject(projectId: number | string, projectData: ProjectRequest | FormData) {
  const isFormData = typeof FormData !== "undefined" && projectData instanceof FormData;
  await authSend(`/api/admin/projects/${projectId}`, "PUT", isFormData ? projectData : JSON.stringify(projectData));
  return true;
}

export async function deleteProject(projectId: number | string) {
  const response = await authSend(`/api/admin/projects/${projectId}`, "DELETE");
  return response.text();
}

export async function fetchProjectMedia(projectId: number | string): Promise<ProjectMedia[]> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/media`);
  if (!response.ok) await handleResponseError(response); return response.json();
}

export async function createProjectMedia(projectId: number, data: ProjectMediaUpload): Promise<ProjectMedia> {
  const formData = new FormData();
  formData.append("file", data.file);
  formData.append("caption", data.caption || "");
  formData.append("description", data.description || "");
  formData.append("altText", data.altText || "");
  formData.append("sortOrder", String(data.sortOrder ?? 0));
  const response = await authSend(`/api/admin/projects/${projectId}/media`, "POST", formData);
  return response.json();
}

export async function updateProjectMedia(projectId: number | string, mediaId: number | string, data: ProjectMediaUpdate | FormData) {
  const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
  await authSend(`/api/admin/projects/${projectId}/media/${mediaId}`, "PUT", isFormData ? data : JSON.stringify(data));
  return true;
}

export async function deleteProjectMedia(projectId: number | string, mediaId: number | string) {
  await authSend(`/api/admin/projects/${projectId}/media/${mediaId}`, "DELETE");
  return true;
}

/* =========================================================================
 * 7. 상품 (Product & Image) API
 * ========================================================================= */

export interface ProductQueryParams {
  category?: string;
  search?: string;
}

export async function fetchProducts(params?: ProductQueryParams): Promise<ProductListResponse[]> {
  const query = new URLSearchParams();
  
  // 파라미터가 존재할 경우에만 쿼리 스트링에 추가 (자동으로 URL 인코딩 처리됨)
  if (params?.category && params.category !== "ALL") {
    query.append("category", params.category);
  }
  if (params?.search) {
    query.append("search", params.search);
  }

  const queryString = query.toString();
  const url = queryString 
    ? `${API_BASE_URL}/api/products?${queryString}` 
    : `${API_BASE_URL}/api/products`;

  const response = await fetch(url);
  
  if (!response.ok) {
    await handleResponseError(response); 
  }
  
  return response.json();
}

export async function getProductById(productId: number | string): Promise<ProductDetailResponse> {
  const response = await fetch(`${API_BASE_URL}/api/products/${productId}`);
  if (!response.ok) await handleResponseError(response); return response.json();
}

// Admin 영역 (이미 규칙에 맞음)
export interface ProductImageUpload {
  file: File;
  imageType?: string;
  altText?: string;
  sortOrder?: number;
}

export async function fetchAdminProducts(): Promise<AdminProduct[]> {
  const response = await authSend("/api/admin/products", "GET");
  return response.json();
}

export async function createProduct(productData: ProductRequest | FormData): Promise<AdminProduct> {
  const isFormData = typeof FormData !== "undefined" && productData instanceof FormData;
  const response = await authSend("/api/admin/products", "POST", isFormData ? productData : JSON.stringify(productData));
  return response.json();
}

export async function updateProduct(productId: number | string, productData: ProductRequest | FormData) {
  const isFormData = typeof FormData !== "undefined" && productData instanceof FormData;
  await authSend(`/api/admin/products/${productId}`, "PUT", isFormData ? productData : JSON.stringify(productData));
  return true;
}

export async function deleteProduct(productId: number | string) {
  const response = await authSend(`/api/admin/products/${productId}`, "DELETE");
  return response.text();
}

export async function fetchProductImages(productId: number | string): Promise<ProductImage[]> {
  const token = getAccessToken();
  const response = await fetch(`${API_BASE_URL}/api/products/${productId}/images`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    credentials: "include",
  });
  if (!response.ok) await handleResponseError(response); return response.json();
}

function isUploadFormData(data: ProductImageUpload | FormData): data is FormData {
  return typeof FormData !== "undefined" && data instanceof FormData;
}

export async function uploadProductImage(productId: number | string, data: ProductImageUpload | FormData) {
  let finalBody: FormData;
  if (isUploadFormData(data)) {
    finalBody = data;
  } else {
    finalBody = new FormData();
    finalBody.append("file", data.file);
    if (data.imageType) finalBody.append("imageType", data.imageType);
    if (data.altText) finalBody.append("altText", data.altText);
    if (data.sortOrder !== undefined) finalBody.append("sortOrder", String(data.sortOrder));
  }
  await authSend(`/api/admin/products/${productId}/images`, "POST", finalBody);
  return true;
}

export async function deleteProductImage(productId: number | string, imageId: number | string) {
  await authSend(`/api/admin/products/${productId}/images/${imageId}`, "DELETE");
  return true;
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
  colorId?: number | null;
  colorName?: string | null;
}

export interface GuestCartItem {
  cartItemId: number;
  productId: number;
  productName: string;
  price: number;
  thumbnailUrl?: string | null;
  quantity: number;
  colorId?: number | null;
  colorName?: string | null;
}

export interface CartProductInput {
  id: number;
  name: string;
  price: number;
  thumbnail?: string | null;
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
export function parseGuestCart(value: unknown): GuestCartItem[] {
  return recoverGuestCart(value);
}

export const getGuestCart = (): GuestCartItem[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const stored = localStorage.getItem(GUEST_CART_KEY);

  if (!stored) {
    return [];
  }

  try {
    const raw = JSON.parse(stored);
    const parsed = parseGuestCart(raw);
    if (JSON.stringify(parsed) !== JSON.stringify(raw)) {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(parsed));
    }
    return parsed;
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
  const auth = await resolveAuthState();
  if (auth.phase === "guest") {
    return getGuestCart();
  }
  if (auth.phase !== "authenticated") {
    throw new ApiRequestError(auth.message, "recovery_failed");
  }
  const response = await authorizedFetch(`${API_BASE_URL}/api/cart`);
  if (!response.ok) {
    await handleResponseError(response);
  }
  return response.json();
};

/**
 * 장바구니 상품 추가
 *
 * 로그인 사용자 → 서버
 * 비회원 → guestCart
 */
export const addCartItem = async (
  product: CartProductInput,
  quantity: number,
  color?: { id: number; name: string } | null
): Promise<void> => {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    throw new Error("수량은 1개 이상 99개 이하여야 합니다.");
  }
  const auth = await resolveAuthState();
  if (auth.phase === "recovery_failed") {
    throw new ApiRequestError(auth.message, "recovery_failed");
  }
  if (auth.phase === "authenticated") {
    const response = await authorizedFetch(`${API_BASE_URL}/api/cart`, {
      method: "POST",
      body: JSON.stringify({
        productId: product.id,
        quantity,
        colorId: color?.id ?? null,
      }),
    });
    if (!response.ok) {
      await handleResponseError(response);
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("cartChanged"));
    }
    return;
  }

  const line: GuestLineInput = {
    productId: product.id,
    productName: product.name,
    price: product.price,
    thumbnailUrl: product.thumbnail,
    quantity,
    colorId: color?.id ?? null,
    colorName: color?.name ?? null,
  };
  setGuestCart(addGuestLine(getGuestCart(), line));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cartChanged"));
  }
};

/**
 * 서버 장바구니 추가
 *
 * 이 함수는 로그인 사용자 전용 API다.
 */
export async function addToCart(
  productId: number,
  quantity: number = 1,
  colorId?: number | null
) {
  const response = await authorizedFetch(`${API_BASE_URL}/api/cart`, {
    method: "POST",
    body: JSON.stringify({
      productId,
      quantity,
      colorId: colorId ?? null,
    }),
  });
  if (!response.ok) {
    await handleResponseError(response);
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
  const response = await authorizedFetch(
    `${API_BASE_URL}/api/cart/${cartItemId}?quantity=${quantity}`,
    { method: "PUT" }
  );
  if (!response.ok) {
    await handleResponseError(response);
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
  const response = await authorizedFetch(`${API_BASE_URL}/api/cart/${cartItemId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    await handleResponseError(response);
  }
  return response.text();
}

/**
 * 장바구니 수량 조회
 */
export const fetchCartCount = async (): Promise<number> => {
  const auth = await resolveAuthState();
  if (auth.phase === "guest") {
    return getGuestCart().reduce((sum, item) => sum + item.quantity, 0);
  }
  if (auth.phase !== "authenticated") {
    throw new ApiRequestError(auth.message, "recovery_failed");
  }
  const response = await authorizedFetch(`${API_BASE_URL}/api/cart/count`);
  if (!response.ok) {
    await handleResponseError(response);
  }
  const serverCount = await response.json();
  const pendingCount = getGuestCart().reduce((sum, item) => sum + item.quantity, 0);
  return serverCount + pendingCount;
};

/**
 * 비회원 장바구니 → 로그인 사용자 장바구니 동기화
 */
const SYNC_KEY_STORAGE = "guestCartSyncKey";

export function guestCartSyncKey(items: { productId: number; quantity: number; colorId?: number | null }[]): string {
  if (typeof window === "undefined") {
    throw new ApiRequestError("장바구니 병합 키는 브라우저에서만 만듭니다.", "recovery_failed");
  }
  const fingerprint = items
    .map((item) => item.colorId
      ? `${item.productId}:${item.colorId}:${item.quantity}`
      : `${item.productId}:${item.quantity}`)
    .sort()
    .join("|");
  const raw = sessionStorage.getItem(SYNC_KEY_STORAGE);
  if (raw) {
    try {
      const saved = JSON.parse(raw) as { fingerprint?: string; key?: string };
      if (saved.fingerprint === fingerprint && saved.key) {
        return saved.key;
      }
    } catch {
      sessionStorage.removeItem(SYNC_KEY_STORAGE);
    }
  }
  const key = crypto.randomUUID();
  sessionStorage.setItem(SYNC_KEY_STORAGE, JSON.stringify({ fingerprint, key }));
  return key;
}

export async function syncLocalCartToServer(
  items: GuestCartItem[]
): Promise<void> {
  const guestItems = parseGuestCart(items);
  if (guestItems.length === 0) {
    return;
  }
  const payload = guestItems.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    ...(item.colorId ? { colorId: item.colorId } : {}),
  }));
  const syncKey = guestCartSyncKey(payload);
  const response = await authorizedFetch(`${API_BASE_URL}/api/cart/sync`, {
    method: "POST",
    headers: { "Idempotency-Key": syncKey },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    await handleResponseError(response);
  }
  sessionStorage.removeItem(SYNC_KEY_STORAGE);
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
  const response = await authSend(`/api/admin/users?${params.toString()}`, "GET");
  return response.json();
}

export function getCustomerTier(totalSpent: number) {
  if (totalSpent >= 1000000) return "VIP"; if (totalSpent >= 300000) return "GOLD"; if (totalSpent >= 100000) return "SILVER"; return "BRONZE";
}

/* =========================================================================
 * 결제 (Payment) API
 * ========================================================================= */
export const confirmPayment = async (paymentData: { paymentKey: string; orderId: string; amount: number }) => {
  const response = await authorizedFetch(`${API_BASE_URL}/api/payments/confirm`, {
    method: "POST",
    body: JSON.stringify(paymentData),
  });
  if (!response.ok) await handleResponseError(response);
  return response.json();
};

export interface PaymentHistoryResponse { id: number; orderId: string; paymentKey: string; amount: number; status: string; cancelReason: string | null; createdAt: string; canceledAt: string | null; }

export const fetchPaymentHistory = async (status: "DONE" | "CANCELED"): Promise<PaymentHistoryResponse[]> => {
  const response = await authorizedFetch(`${API_BASE_URL}/api/payments/history?status=${status}`);
  if (!response.ok) await handleResponseError(response);
  return response.json();
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
  const response = await authSend("/api/admin/community/posts", "POST", JSON.stringify(data));
  return response.json();
};

export const updateCommunityPost = async (id: number | string, data: CommunityPostCreatePayload) => {
  const response = await authSend(`/api/admin/community/posts/${id}`, "PUT", JSON.stringify(data));
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

export async function deleteCommunityPost(
  id: string | number
): Promise<void> {
  await authSend(`/api/admin/community/posts/${id}`, "DELETE");
}