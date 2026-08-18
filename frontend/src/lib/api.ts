export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api";

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

export interface ResumeProfile {
  id?: number;
  name: string;
  jobTitle?: string | null;
  email?: string | null;
  phone?: string | null;
  githubUrl?: string | null;
  profileImage?: string | null;
  shortIntro?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

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

export function updateResumeProfile(data: Omit<ResumeProfile, "id" | "createdAt" | "updatedAt">) {
  return resumeRequest<ResumeProfile>("/profile", "PUT", data);
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

export async function fetchProjects(featured?: boolean) {
  const query = featured ? "?featured=true" : "";
  const response = await fetch(`${API_BASE_URL}/projects${query}`, { cache: "no-store" });
  if (!response.ok) throw new Error("프로젝트 목록을 불러오지 못했습니다.");
  return (await response.json()) as PortfolioProject[];
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
