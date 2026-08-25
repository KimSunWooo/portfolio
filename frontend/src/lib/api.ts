// src/lib/api.ts

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api";

export const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

// =========================
// Community API
// =========================

export type CommunityCategory = "NOTICE" | "FAQ" | "EVENT" | "QNA";

export interface CommunityPostListItem {
  id: number;
  category: CommunityCategory;
  title: string;
  author: string;
  viewCount: number;
  isPinned: boolean;
  createdAt: string;
}

export interface CommunityPostDetail extends CommunityPostListItem {
  content: string;
  updatedAt: string;
}

export interface CommunityPostCreateRequest {
  category: CommunityCategory;
  title: string;
  content: string;
  author: string;
  isPinned: boolean;
}

export async function fetchCommunityPosts(category?: string) {
  const query = category ? `?category=${encodeURIComponent(category)}` : "";
  const response = await fetch(`${API_BASE_URL}/community/posts${query}`, {
    cache: "no-store",
  });

  if (!response.ok) throw new Error("게시글 목록을 불러오지 못했습니다.");
  return (await response.json()) as CommunityPostListItem[];
}

export async function fetchCommunityPost(id: string | number) {
  const response = await fetch(`${API_BASE_URL}/community/posts/${id}`, {
    cache: "no-store",
  });

  if (!response.ok) throw new Error("게시글을 불러오지 못했습니다.");
  return (await response.json()) as CommunityPostDetail;
}

export async function createCommunityPost(data: CommunityPostCreateRequest) {
  const response = await fetch(`${API_BASE_URL}/community/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "게시글 등록에 실패했습니다.");
  }

  return (await response.json()) as CommunityPostDetail;
}


// =========================
// Resume API
// =========================

export type ResumeProfile = {
  name?: string | null;
  jobTitle?: string | null;
  email?: string | null;
  phone?: string | null;
  githubUrl?: string | null;
  profileImage?: string | null;
  shortIntro?: string | null;
};

export type UpdateResumeProfileRequest = {
  name?: string | null;
  jobTitle?: string | null;
  email?: string | null;
  phone?: string | null;
  githubUrl?: string | null;
  profileImage?: File | null;
  shortIntro?: string | null;
};

export interface ResumeSkill {
  id: number;
  name: string;
  category?: string | null;
  level?: string | null;
  sortOrder?: number | null;
}

export interface ResumeExperience {
  id: number;
  companyName: string;
  position?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
  sortOrder?: number | null;
}

export interface ResumeEducation {
  id: number;
  schoolName: string;
  major?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
  sortOrder?: number | null;
}

export interface ResumeIntroduction {
  id: number;
  title?: string | null;
  content: string;
  sortOrder?: number | null;
}

export interface ResumeData {
  profile: ResumeProfile | null;
  skills: ResumeSkill[];
  experiences: ResumeExperience[];
  educations: ResumeEducation[];
  introductions: ResumeIntroduction[];
}

export async function fetchResume(): Promise<ResumeData> {
  const response = await fetch(`${API_BASE_URL}/resume`, { cache: "no-store" });
  if (!response.ok) throw new Error("이력서 정보를 불러오지 못했습니다.");
  return response.json();
}

async function resumeRequest<T>(
  path: string,
  method: "POST" | "PUT" | "DELETE",
  body?: unknown
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/resume${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.error ?? "요청 처리에 실패했습니다.");
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export async function updateResumeProfile(
  payload: UpdateResumeProfileRequest
) {
  const formData = new FormData();

  formData.append("name", payload.name ?? "");
  formData.append("jobTitle", payload.jobTitle ?? "");
  formData.append("email", payload.email ?? "");
  formData.append("phone", payload.phone ?? "");
  formData.append("githubUrl", payload.githubUrl ?? "");
  formData.append("shortIntro", payload.shortIntro ?? "");

  if (payload.profileImage) {
    formData.append("profileImage", payload.profileImage);
  }

  const response = await fetch(
    `${API_BASE_URL}/resume/profile`,
    {
      method: "PUT",
      body: formData,
    }
  );

  const contentType = response.headers.get("content-type");
  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      `프로필 저장에 실패했습니다. (${response.status})`
    );
  }

  if (
    contentType?.includes("application/json") &&
    text.trim()
  ) {
    return JSON.parse(text);
  }

  return null;
}

export function createResumeSkill(data: Omit<ResumeSkill, "id">) {
  return resumeRequest<ResumeSkill>("/skills", "POST", data);
}
export function updateResumeSkill(id: number, data: Omit<ResumeSkill, "id">) {
  return resumeRequest<ResumeSkill>(`/skills/${id}`, "PUT", data);
}
export function deleteResumeSkill(id: number) {
  return resumeRequest<void>(`/skills/${id}`, "DELETE");
}

export function createResumeExperience(data: Omit<ResumeExperience, "id">) {
  return resumeRequest<ResumeExperience>("/experiences", "POST", data);
}
export function updateResumeExperience(id: number, data: Omit<ResumeExperience, "id">) {
  return resumeRequest<ResumeExperience>(`/experiences/${id}`, "PUT", data);
}
export function deleteResumeExperience(id: number) {
  return resumeRequest<void>(`/experiences/${id}`, "DELETE");
}

export function createResumeEducation(data: Omit<ResumeEducation, "id">) {
  return resumeRequest<ResumeEducation>("/educations", "POST", data);
}
export function updateResumeEducation(id: number, data: Omit<ResumeEducation, "id">) {
  return resumeRequest<ResumeEducation>(`/educations/${id}`, "PUT", data);
}
export function deleteResumeEducation(id: number) {
  return resumeRequest<void>(`/educations/${id}`, "DELETE");
}

export function createResumeIntroduction(data: Omit<ResumeIntroduction, "id">) {
  return resumeRequest<ResumeIntroduction>("/introductions", "POST", data);
}
export function updateResumeIntroduction(id: number, data: Omit<ResumeIntroduction, "id">) {
  return resumeRequest<ResumeIntroduction>(`/introductions/${id}`, "PUT", data);
}
export function deleteResumeIntroduction(id: number) {
  return resumeRequest<void>(`/introductions/${id}`, "DELETE");
}


// =========================
// Project API
// =========================

export type ProjectStatus = "PLANNING" | "IN_PROGRESS" | "COMPLETED";

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
  createdAt?: string | null;
  updatedAt?: string | null;
}

export type ProjectRequest = Omit<PortfolioProject, "id" | "createdAt" | "updatedAt">;
export type ProjectMediaType = "IMAGE" | "VIDEO";

export interface ProjectMedia {
  id: number;
  projectId: number;
  mediaType: ProjectMediaType;
  mediaUrl: string;
  caption?: string | null;
  altText?: string | null;
  sortOrder: number;
}

export async function fetchProjects(featured?: boolean) {
  const query = featured ? "?featured=true" : "";
  const response = await fetch(`${API_BASE_URL}/projects${query}`, { cache: "no-store" });
  if (!response.ok) throw new Error("프로젝트 목록을 불러오지 못했습니다.");
  return (await response.json()) as PortfolioProject[];
}

export async function fetchProject(id: number | string) {
  const response = await fetch(
    `${API_BASE_URL}/projects/${id}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("프로젝트 정보를 불러오지 못했습니다.");
  }

  return (await response.json()) as PortfolioProject;
}

export async function createProject(data: ProjectRequest) {
  return requestProject("", "POST", data);
}
export async function updateProject(id: number, data: ProjectRequest) {
  return requestProject(`/${id}`, "PUT", data);
}
export async function deleteProject(id: number) {
  const response = await fetch(`${API_BASE_URL}/projects/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("프로젝트 삭제에 실패했습니다.");
}
async function requestProject(path: string, method: "POST" | "PUT", data: ProjectRequest) {
  const response = await fetch(`${API_BASE_URL}/projects${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "프로젝트 저장에 실패했습니다.");
  }
  return (await response.json()) as PortfolioProject;
}

export async function fetchProjectMedia(projectId: number) {
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/media`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("프로젝트 미디어를 불러오지 못했습니다.");
  }

  return (await response.json()) as ProjectMedia[];
}

export async function createProjectMedia(
  projectId: number,
  data: {
    file: File;
    caption?: string;
    altText?: string;
    sortOrder?: number;
  }
) {
  const formData = new FormData();

  formData.append("file", data.file);
  formData.append("caption", data.caption ?? "");
  formData.append("altText", data.altText ?? "");
  formData.append("sortOrder", String(data.sortOrder ?? 0));

  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/media`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const body = await response.json().catch(() => null);

    throw new Error(
      body?.message ??
      body?.error ??
      "프로젝트 미디어 등록에 실패했습니다."
    );
  }

  return (await response.json()) as ProjectMedia;
}

export async function updateProjectMedia(
  projectId: number,
  mediaId: number,
  data: {
    caption?: string;
    altText?: string;
    sortOrder?: number;
  }
) {
  const formData = new FormData();

  formData.append("caption", data.caption ?? "");
  formData.append("altText", data.altText ?? "");
  formData.append("sortOrder", String(data.sortOrder ?? 0));

  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/media/${mediaId}`,
    {
      method: "PUT",
      body: formData,
    }
  );

  if (!response.ok) {
    const body = await response.json().catch(() => null);

    throw new Error(
      body?.message ??
      body?.error ??
      "프로젝트 미디어 수정에 실패했습니다."
    );
  }

  return (await response.json()) as ProjectMedia;
}

export async function deleteProjectMedia(
  projectId: number,
  mediaId: number
) {
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/media/${mediaId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    const body = await response.json().catch(() => null);

    throw new Error(
      body?.message ??
      body?.error ??
      "프로젝트 미디어 삭제에 실패했습니다."
    );
  }
}

// =========================
// Cafe24 API
// =========================

export interface Cafe24IntegrationStatus {
  configured: boolean;
  mallId: string | null;
  apiBaseUrl: string | null;
  redirectUri: string | null;
  oauthReady: boolean;
  message: string;
}

export async function fetchCafe24IntegrationStatus() {
  const response = await fetch(`${API_BASE_URL}/integrations/cafe24/status`, { cache: "no-store" });
  if (!response.ok) throw new Error("Cafe24 연동 상태를 확인하지 못했습니다.");
  return (await response.json()) as Cafe24IntegrationStatus;
}


// =========================
// Utilities
// =========================

export function resolveAssetUrl(path?: string | null) {
  if (!path) return null;

  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("blob:") ||
    path.startsWith("data:")
  ) {
    return path;
  }

  return `${BACKEND_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}


// =========================
// Shop & Product API
// =========================

export type ProductStatus = "SALE" | "SOLD_OUT" | "HIDDEN";
export type ProductImageType = "MAIN" | "DETAIL";

export interface AdminProduct {
  id: number;
  name: string;
  subtitle?: string | null;
  description?: string | null;
  category?: string | null;
  price: number;
  originalPrice?: number | null;
  thumbnail?: string | null;
  isNew: boolean;
  isBest: boolean;
  stock: number;
  status: ProductStatus;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export type ProductRequest = Omit<AdminProduct, "id" | "createdAt" | "updatedAt">;

// 1. 상품 목록 조회용 DTO (ProductController의 getProducts 반환 타입)
export interface ProductListResponse {
  id: number;
  name: string;
  subtitle?: string | null;
  price: number;
  originalPrice?: number | null;
  thumbnail?: string | null;
  isNew: boolean;
  isBest: boolean;
}

// 2. 상품 상세 정보 내부 객체 타입 정의
export interface ProductDetailInfo {
  shortDescription?: string | null;
  description?: string | null;
  ingredients?: string | null;
  usageInfo?: string | null;
  productInfo?: string | null;
}

export interface ProductImage {
  id: number;
  productId?: number;
  imageUrl: string;
  caption?: string | null;
  altText?: string | null;
  imageType?: ProductImageType | string | null;
  sortOrder: number;
}

export interface ProductColor {
  id: number;
  colorName: string;
  colorCode: string;
  imageUrl?: string | null;
  stock: number;
  sortOrder: number;
}

// 3. 상품 상세 조회용 DTO (ProductDetailResponse.java와 1:1 매핑)
export interface ProductDetailResponse {
  id: number;
  name: string;
  category?: string | null;
  price: number;
  originalPrice?: number | null;
  thumbnail?: string | null;
  isNew: boolean;
  isBest: boolean;
  stock: number;
  status: ProductStatus | string;
  detail: ProductDetailInfo | null;
  images: ProductImage[];
  colors: ProductColor[];
}

// --- Admin API Fetch Functions ---

export async function fetchAdminProducts() {
  const response = await fetch(
    `${API_BASE_URL}/products/admin`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      "상품 목록을 불러오지 못했습니다."
    );
  }

  return (await response.json()) as AdminProduct[];
}

export async function createProduct(data: ProductRequest) {
  return requestProduct("", "POST", data);
}

export async function updateProduct(id: number, data: ProductRequest) {
  return requestProduct(`/${id}`, "PUT", data);
}

export async function deleteProduct(id: number) {
  const response = await fetch(
    `${API_BASE_URL}/products/${id}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error("상품 삭제에 실패했습니다.");
  }
}

async function requestProduct(
  path: string,
  method: "POST" | "PUT",
  data: ProductRequest
) {
  const response = await fetch(
    `${API_BASE_URL}/products${path}`,
    {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const body = await response.json().catch(() => null);

    throw new Error(
      body?.message ??
      body?.error ??
      "상품 저장에 실패했습니다."
    );
  }

  return (await response.json()) as AdminProduct;
}

// --- Public API Fetch Functions ---

export async function fetchProducts(category?: string): Promise<ProductListResponse[]> {
  const query = category ? `?category=${encodeURIComponent(category)}` : "";
  const response = await fetch(`${API_BASE_URL}/products${query}`, { 
    cache: "no-store", 
  });
  
  if (!response.ok) {
    throw new Error("상품 목록을 불러오지 못했습니다.");
  }
  
  return (await response.json()) as ProductListResponse[];
}

export async function fetchProduct(id: string | number): Promise<ProductDetailResponse> {
  const response = await fetch(`${API_BASE_URL}/products/${id}`, {
    cache: "no-store",
  });
  
  if (!response.ok) {
    throw new Error("상품 상세 정보를 불러오지 못했습니다.");
  }
  
  return (await response.json()) as ProductDetailResponse;
}

// --- Image API Fetch Functions ---

export async function fetchProductImages(productId: number) {
  const response = await fetch(
    `${API_BASE_URL}/products/${productId}/images`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("상품 이미지를 불러오지 못했습니다.");
  }

  return (await response.json()) as ProductImage[];
}

export async function uploadProductImage(
  productId: number,
  data: {
    file: File;
    caption?: string;
    altText?: string;
    imageType: ProductImageType;
    sortOrder?: number;
  }
) {
  const formData = new FormData();

  formData.append("file", data.file);
  formData.append("caption", data.caption ?? "");
  formData.append("altText", data.altText ?? "");
  formData.append("imageType", data.imageType);
  formData.append(
    "sortOrder",
    String(data.sortOrder ?? 0)
  );

  const response = await fetch(
    `${API_BASE_URL}/products/${productId}/images`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const body = await response.json().catch(() => null);

    throw new Error(
      body?.message ??
        body?.error ??
        "상품 이미지 등록에 실패했습니다."
    );
  }

  return (await response.json()) as ProductImage;
}

export async function updateProductImage(
  productId: number,
  imageId: number,
  data: {
    caption?: string;
    altText?: string;
    imageType?: ProductImageType;
    sortOrder?: number;
  }
) {
  const formData = new FormData();

  formData.append("caption", data.caption ?? "");
  formData.append("altText", data.altText ?? "");

  if (data.imageType) {
    formData.append("imageType", data.imageType);
  }

  formData.append(
    "sortOrder",
    String(data.sortOrder ?? 0)
  );

  const response = await fetch(
    `${API_BASE_URL}/products/${productId}/images/${imageId}`,
    {
      method: "PUT",
      body: formData,
    }
  );

  if (!response.ok) {
    const body = await response.json().catch(() => null);

    throw new Error(
      body?.message ??
        body?.error ??
        "상품 이미지 수정에 실패했습니다."
    );
  }

  return (await response.json()) as ProductImage;
}

export async function deleteProductImage(
  productId: number,
  imageId: number
) {
  const response = await fetch(
    `${API_BASE_URL}/products/${productId}/images/${imageId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error("상품 이미지 삭제에 실패했습니다.");
  }
}