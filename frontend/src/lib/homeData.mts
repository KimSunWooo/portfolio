/**
 * Home SSR data loading: parallel resume/projects fetches with timeout
 * and verified public fallbacks so one slow/failed API does not blank the page.
 */

/**
 * Minimal structural shape needed to merge/fall back. Callers keep their own
 * concrete type (e.g. ResumeData) through the generics below.
 */
export type HomeResumeData = {
  profile?: object | null;
  skills: readonly { id: number }[];
  experiences: readonly { id: number }[];
  educations: readonly { id: number }[];
  introductions: readonly { id: number }[];
};

export type HomeProject = {
  id: number;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  techStack?: string | null;
  projectUrl?: string | null;
  githubUrl?: string | null;
  status: string;
  isFeatured?: boolean;
  sortOrder?: number;
};

export const HOME_FETCH_TIMEOUT_MS = 4_000;

/** No project is invented when the API cannot be reached. */
export const PUBLIC_FEATURED_PROJECT_FALLBACK: HomeProject[] = [];

export function selectHomeProjects<T extends HomeProject>(projects: T[]): T[] {
  const featured = projects.filter((project) => project.isFeatured);
  if (featured.length) return featured;
  return projects.filter((project) =>
    Boolean(project.description?.trim() || project.githubUrl?.trim() || project.projectUrl?.trim())
  ).slice(0, 3);
}

export function mergeResume<T extends HomeResumeData>(fetched: T, fallback: T): T {
  const hasContent =
    Boolean(fetched.profile) ||
    fetched.skills.length > 0 ||
    fetched.experiences.length > 0 ||
    fetched.educations.length > 0 ||
    fetched.introductions.length > 0;

  if (!hasContent) {
    return fallback;
  }

  return {
    ...fetched,
    profile: fetched.profile ?? fallback.profile,
    skills: fetched.skills.length ? fetched.skills : fallback.skills,
    experiences: fetched.experiences.length ? fetched.experiences : fallback.experiences,
    educations: fetched.educations.length ? fetched.educations : fallback.educations,
    introductions: fetched.introductions.length
      ? fetched.introductions
      : fallback.introductions,
  } as T;
}

export function resolveProjects<T extends HomeProject = HomeProject>(
  result: PromiseSettledResult<T[]>,
  fallback?: T[]
): T[] {
  if (result.status === "fulfilled" && Array.isArray(result.value)) {
    return result.value;
  }
  return fallback ?? (PUBLIC_FEATURED_PROJECT_FALLBACK as unknown as T[]);
}

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`${label} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

export async function loadHomeContent<TResume extends HomeResumeData, TProject extends HomeProject>(options: {
  fetchResume: () => Promise<TResume>;
  fetchProjects: () => Promise<TProject[]>;
  fallbackResume: TResume;
  fallbackProjects?: TProject[];
  timeoutMs?: number;
}): Promise<{ resume: TResume; projects: TProject[] }> {
  const timeoutMs = options.timeoutMs ?? HOME_FETCH_TIMEOUT_MS;
  const fallbackProjects = (options.fallbackProjects ??
    PUBLIC_FEATURED_PROJECT_FALLBACK) as unknown as TProject[];

  const [resumeResult, projectsResult] = await Promise.allSettled([
    withTimeout(options.fetchResume(), timeoutMs, "resume"),
    withTimeout(options.fetchProjects(), timeoutMs, "projects"),
  ]);

  const resume =
    resumeResult.status === "fulfilled"
      ? mergeResume(resumeResult.value, options.fallbackResume)
      : options.fallbackResume;

  const projects = resolveProjects(projectsResult, fallbackProjects);

  return { resume, projects };
}
