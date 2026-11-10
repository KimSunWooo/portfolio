import Link from "next/link";
import Header from "../components/header/Header";
import Footer from "../components/layout/Footer";
import MarkdownContent from "../components/common/MarkdownContent";
import IntroductionCarousel from "../components/home/IntroductionCarousel";
import HomeSceneBanner from "../components/home/HomeSceneBanner";
import bannerStyles from "../components/home/HomeSceneBanner.module.css";
import { splitIntroductionSections } from "../components/home/introductionSections";
import SkillStackSlider from "../components/home/SkillStackSlider";
import CacheMetricsPanel from "../components/home/CacheMetricsPanel";
import ribbonStyles from "../components/home/homeRibbon.module.css";
import shell from "../components/home/homeShell.module.css";
import {
  fetchProjects,
  fetchResume,
  type PortfolioProject,
  type ResumeData,
} from "../lib/api";
export const dynamic = "force-dynamic";

const fallback: ResumeData = {
  profile: {
    name: "김선우",
    jobTitle: "Backend / Full-stack Developer",
    githubUrl: "https://github.com/KimSunWooo",
    profileImage: "/uploads/profile/87c022a8-51c9-42f6-8eed-217884d03cf8.png",
    shortIntro:
      "Java를 중심으로 웹 서비스를 개발하고, 데이터베이스부터 화면까지 서비스의 전체 흐름을 이해하며 구현하는 개발자 김선우입니다.",
  },

  skills: [
    { id: 1, name: "Java", category: "Backend", level: "Intermediate", sortOrder: 1 },
    { id: 2, name: "Spring Boot", category: "Backend", level: "Intermediate", sortOrder: 2 },
    { id: 3, name: "MySQL", category: "Database", level: "Intermediate", sortOrder: 3 },
    { id: 4, name: "JavaScript", category: "Frontend", level: "Intermediate", sortOrder: 4 },
    { id: 5, name: "React", category: "Frontend", level: "Intermediate", sortOrder: 5 },
    { id: 6, name: "Next.js", category: "Frontend", level: "Intermediate", sortOrder: 6 },
    { id: 7, name: "Git", category: "Tools", level: "Intermediate", sortOrder: 7 },
    { id: 8, name: "Python", category: "Tools", level: "Intermediate", sortOrder: 8 },
    { id: 9, name: "Aws EC2 Cloud", category: "Infra", level: "Intermediate", sortOrder: 9 },
    { id: 10, name: "Docker", category: "Infra", level: "Intermediate", sortOrder: 10 },
    { id: 11, name: "Git action", category: "Infra", level: "Intermediate", sortOrder: 11 },
    { id: 12, name: "Aws S3 Storage", category: "Infra", level: "Intermediate", sortOrder: 12 },
    { id: 13, name: "Linux", category: "OS", level: "Intermediate", sortOrder: 13 },
  ],

  experiences: [
    {
      id: 1,
      companyName: "Career",
      position: "웹 서비스 개발 및 유지보수",
      startDate: "2023-01-01",
      endDate: "2025-01-01",
      description: `
Java 기반 웹 서비스 개발 및 유지보수를 담당했습니다.

### 주요 업무

- Java 기반 서버 기능 구현
- 데이터베이스 조회 및 데이터 처리
- 프론트엔드 화면과 서버 API 연동
- 기존 서비스 유지보수 및 기능 개선

### 문제 해결

서비스 개발 과정에서 발생하는 오류를 분석하고,
서버와 데이터베이스의 흐름을 확인하여 문제를 해결했습니다.
`,
      sortOrder: 1,
    },
  ],

  educations: [
    {
      id: 1,
      schoolName: "경기대학교",
      major: "학사 과정",
      description: "4년제",
      sortOrder: 1,
    },
  ],

  introductions: [
    {
      id: 1,
      title: "서비스의 전체 흐름을 이해하고 문제를 해결합니다.",
      content: `
Java와 Spring Boot를 중심으로 백엔드 개발 역량을 쌓으며,
프론트엔드와 데이터베이스까지 직접 연결해 웹 서비스의 전체 흐름을 경험하고 있습니다.

### 개발 방식

- 새로운 기술을 사용할 때 **왜 필요한지** 먼저 이해합니다.
- 문제가 발생하면 특정 코드에만 집중하지 않고 전체 흐름을 따라가며 원인을 분석합니다.
- AI 도구를 활용해 개발 생산성을 높이되, 생성된 결과는 직접 검증한 뒤 적용합니다.

### 지향하는 개발자

기능을 만드는 것에 그치지 않고,
**실제 서비스가 어떻게 동작하는지 이해하고 끝까지 문제를 해결하는 개발자**를 지향합니다.
`,
      sortOrder: 1,
    },
  ],
};

function formatPeriod(start?: string | null, end?: string | null) {
  const fmt = (value?: string | null) =>
    value ? value.slice(0, 7).replace("-", ".") : "";

  const left = fmt(start);
  const right = end ? fmt(end) : "PRESENT";

  return left || right ? `${left} — ${right}` : "";
}

export default async function Home() {
  /**
   * --------------------------------------------------------------------------
   * Resume
   * --------------------------------------------------------------------------
   */

  let resume = fallback;

  try {
    const fetched = await fetchResume();

    if (
      fetched.profile ||
      fetched.skills.length ||
      fetched.experiences.length ||
      fetched.educations.length ||
      fetched.introductions.length
    ) {
      resume = {
        ...fetched,
        profile: fetched.profile ?? fallback.profile,
        skills: fetched.skills.length ? fetched.skills : fallback.skills,
        experiences: fetched.experiences.length
          ? fetched.experiences
          : fallback.experiences,
        educations: fetched.educations.length
          ? fetched.educations
          : fallback.educations,
        introductions: fetched.introductions.length
          ? fetched.introductions
          : fallback.introductions,
      };
    }
  } catch (error) {
    console.error("[SSR Fetch Error]:", error);
  }

  /**
   * --------------------------------------------------------------------------
   * Projects
   * --------------------------------------------------------------------------
   */

  let projects: PortfolioProject[] = [];

  try {
    projects = await fetchProjects(true);
  } catch {
    projects = [];
  }

  /**
   * --------------------------------------------------------------------------
   * Profile
   * --------------------------------------------------------------------------
   */

  const profile = resume.profile ?? fallback.profile!;

  const displayName = profile.name || "김선우";
  const englishName = displayName === "김선우" ? "KIM SUN WOO" : "";

  /**
   * --------------------------------------------------------------------------
   * Backend / Profile Image
   * --------------------------------------------------------------------------
   */

  const BACKEND_BASE_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

  const profileImageUrl = profile.profileImage
    ? profile.profileImage.startsWith("http")
      ? profile.profileImage
      : `${BACKEND_BASE_URL}${profile.profileImage}`
    : null;

  /**
   * --------------------------------------------------------------------------
   * Render
   * --------------------------------------------------------------------------
   */

  const firstIntroduction = resume.introductions[0];
  const introductionParts = firstIntroduction
    ? splitIntroductionSections(firstIntroduction.content)
    : { heading: undefined, lead: "", sections: [] };
  const introductionHeading =
    introductionParts.heading || firstIntroduction?.title || "자기소개";
  const introductionLead = introductionParts.lead;

  const troubleshootingItems = [
    {
      title: "장바구니 정합성",
      href: "https://github.com/KimSunWooo/portfolio#1-장바구니-병합-재전송으로-인한-수량-중복-반영-방지",
      body: "동일 병합 요청 재전송에도 수량이 중복되지 않도록 DB UNIQUE와 트랜잭션으로 막았습니다.",
      external: true,
    },
    {
      title: "인증 갱신과 로그아웃 충돌",
      href: "https://github.com/KimSunWooo/portfolio#2-인증-갱신과-로그아웃의-경쟁으로-인한-세션-상태-불일치-해결",
      body: "늦게 도착한 Refresh 응답이 로그아웃 이후 세션을 되살리지 않도록 세대 번호로 폐기합니다.",
      external: true,
    },
    {
      title: "배포 복구",
      href: "https://github.com/KimSunWooo/portfolio#3-배포-준비-검사-실패-시-이전-서비스-복구와-실패-컨테이너-보존",
      body: "새 백엔드 준비 실패 시 이전 서비스로 되돌리고 실패 컨테이너를 보존합니다.",
      external: true,
    },
    {
      title: "브랜치 전략과 배포 기록",
      href: "/community/14",
      body: "PR 검사와 운영 배포를 분리한 흐름과 복구 절차를 커뮤니티 게시글로 정리했습니다.",
      external: false,
    },
  ] as const;

  return (
    <div className={`${shell.page} [--portfolio-surface:#f4f1ef]`}>
      <Header />

      <main className="overflow-x-hidden pt-[76px] max-sm:pt-[62px]">
        <section id="about" className={`${ribbonStyles.hero} ${shell.section} border-b border-black/10`}>
          <svg
            className={ribbonStyles.ribbon}
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path fill="#a16e72" fillOpacity="0.22" d="M0 180 C180 120 260 240 420 190 C580 140 640 90 820 150 C1000 210 1120 250 1440 170 L1440 320 L0 320 Z" />
            <path fill="#c4989b" fillOpacity="0.35" d="M0 210 C200 160 300 250 460 210 C640 160 760 120 940 180 C1100 230 1240 250 1440 200 L1440 320 L0 320 Z" />
            <path fill="#e9dddc" fillOpacity="0.85" d="M0 240 C220 200 340 270 520 230 C700 190 860 160 1040 210 C1200 250 1320 270 1440 230 L1440 320 L0 320 Z" />
          </svg>

          <div className={`${shell.inset} ${ribbonStyles.inner}`}>
            <div className={ribbonStyles.heroGrid}>
              <div className={ribbonStyles.heroCopy}>
                <div className={ribbonStyles.roleBlock}>
                  <p className={ribbonStyles.role}>
                    {(profile.jobTitle || "Backend / Full-stack Developer").toUpperCase()}
                  </p>
                  <div className={ribbonStyles.accentRule} aria-hidden="true" />
                </div>
                <h1 className={`${ribbonStyles.name} mt-6`}>{displayName}</h1>
                {englishName ? <p className={ribbonStyles.english}>{englishName}</p> : null}
                <div className="mt-8 border-t border-[#242225]/15 pt-5">
                  <p className={`${ribbonStyles.copy} whitespace-pre-wrap`}>{profile.shortIntro}</p>
                </div>
                {profileImageUrl ? (
                  <div className={`${ribbonStyles.profileSlot} md:hidden`}>
                    <div className={ribbonStyles.profileFrame}>
                      <img src={profileImageUrl} alt={profile.name ?? "Profile"} />
                    </div>
                  </div>
                ) : null}
              </div>

              {profileImageUrl ? (
                <div className={`${ribbonStyles.profileFrame} max-md:hidden`}>
                  <img src={profileImageUrl} alt={profile.name ?? "Profile"} />
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section id="skills" className={`${shell.section} bg-[#f4f1ef]`}>
          <div className={shell.inset}>
            <p className={shell.kicker}>01 · SKILLS</p>
            <h2 className={shell.sectionTitle}>
              기술은 목적이 아니라, 문제를 해결하기 위한 도구라고 생각합니다.
            </h2>
            <div className="mt-10">
              <SkillStackSlider skills={resume.skills} />
            </div>
          </div>
        </section>

        <section id="experience" className={`${shell.section} border-t border-black/10`}>
          <div className={shell.inset}>
            <p className={shell.kicker}>02 · EXPERIENCE</p>
            <h2 className={shell.sectionTitle}>Career</h2>
            <div className="mt-10 border-t border-black">
              {resume.experiences.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[minmax(8rem,12rem)_minmax(0,1fr)] gap-8 border-b border-black/15 py-8 max-md:grid-cols-1 max-md:gap-3"
                >
                  <div className={shell.meta}>{formatPeriod(item.startDate, item.endDate)}</div>
                  <div>
                    <p className={`${shell.meta} mb-2 tracking-[0.12em]`}>{item.companyName}</p>
                    <h3 className={shell.slideTitle}>{item.position}</h3>
                    {item.description ? (
                      <div className={`${shell.body} mt-5`}>
                        <MarkdownContent content={item.description} variant="light" />
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="education" className={shell.section}>
          <div className={shell.inset}>
            <p className={shell.kicker}>03 · EDUCATION</p>
            <div className="mt-6 border-t border-black">
              {resume.educations.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[1fr_auto] gap-8 border-b border-black/15 py-8 max-sm:grid-cols-1 max-sm:gap-3"
                >
                  <div>
                    <h2 className={shell.sectionTitle}>{item.schoolName}</h2>
                    <p className={`${shell.meta} mt-3`}>
                      {[item.major, item.description, formatPeriod(item.startDate, item.endDate)]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <span className={shell.meta}>EDUCATION</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="introduction" className="scroll-mt-20 border-y border-black/10 bg-[#f4f1ef]">
          <HomeSceneBanner
            src="/home/intro-desk.jpg"
            alt="책상 위 노트북과 모니터가 보이는 작업 공간"
            label="WORKSPACE"
            title="일하는 방식"
            imageClassName="object-[68%_42%]"
          >
            <p className={`${bannerStyles.lead} mt-4 font-medium`}>{introductionHeading}</p>
            {introductionLead ? (
              <div className={bannerStyles.lead}>
                <MarkdownContent content={introductionLead} variant="dark" />
              </div>
            ) : null}
          </HomeSceneBanner>

          <div className={`${shell.inset} ${shell.sectionCompact}`}>
            <p className={shell.kicker} style={{ color: "var(--home-accent)" }}>
              04 / INTRODUCTION
            </p>
            <IntroductionCarousel introductions={resume.introductions} showHeader={false} />
          </div>
        </section>

        <section id="redis-cache" className="scroll-mt-20 border-t border-black/10">
          <HomeSceneBanner
            src="/home/cicd-concrete.jpg"
            alt="빛과 그림자가 드리운 콘크리트 건축 공간"
            label="REDIS CACHE"
            title="상품 목록 Redis 캐시의 응답 정합성과 조회 성능 개선"
            imageClassName="object-[62%_40%]"
          >
            <div className={bannerStyles.rows}>
              <div>
                <p className={bannerStyles.rowLabel}>문제</p>
                <p className={bannerStyles.rowBody}>
                  같은 조건으로 상품 목록을 반복 조회할 때 DB 조회가 반복됐습니다.
                </p>
              </div>
              <div>
                <p className={bannerStyles.rowLabel}>개선</p>
                <p className={bannerStyles.rowBody}>
                  카테고리·검색어별 Redis 캐시를 적용하고, 상품 변경이 DB에 커밋된 뒤
                  목록 캐시를 비우도록 구성했습니다.
                </p>
              </div>
              <div>
                <p className={bannerStyles.rowLabel}>검증</p>
                <p className={bannerStyles.rowBody}>
                  캐시 OFF·MISS·HIT 응답을 SHA-256으로 대조했습니다. 상품 목록 SELECT
                  관측값은 600요청 기준 캐시 OFF 591~595회에서 워밍 후 0회로 줄었습니다.
                </p>
                <p className={bannerStyles.metric}>
                  측정 조건: 격리 환경 · k6 10 VU · 30초 · 각 조건 3회 비교
                </p>
              </div>
            </div>
            <CacheMetricsPanel />
            <div className={`${bannerStyles.actions} mt-3`}>
              <Link href="/community/10" className={bannerStyles.secondary}>
                직렬화기 호환성 기록
              </Link>
            </div>
            <p className={`${bannerStyles.metric} mt-4`}>
              Jackson 2 ObjectMapper로 GenericJackson2JsonRedisSerializer를 구성해
              Jackson 3 기반 직렬화기 생성자 호환성 문제를 피한 기록은 위 링크로 남겼습니다.
            </p>
          </HomeSceneBanner>
        </section>

        <section id="troubleshooting" className={`${shell.section} border-t border-black/10`}>
          <div className={shell.inset}>
            <p className={shell.kicker}>05 · TROUBLESHOOTING</p>
            <h2 className={shell.sectionTitle}>대표 구현의 재현·원인·검증 근거</h2>
            <ul className="mt-10 grid gap-8 border-t border-black/15 pt-8 md:grid-cols-2 xl:grid-cols-4">
              {troubleshootingItems.map((item) => (
                <li key={item.title} className="min-w-0">
                  {item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className={`${shell.slideTitle} no-underline hover:opacity-60`}
                    >
                      {item.title} ↗
                    </a>
                  ) : (
                    <Link href={item.href} className={`${shell.slideTitle} no-underline hover:opacity-60`}>
                      {item.title} →
                    </Link>
                  )}
                  <p className={`${shell.body} mt-3`}>{item.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="projects" className={shell.section}>
          <div className={shell.inset}>
            <div className="flex items-end justify-between gap-8 border-b border-black pb-6">
              <div>
                <p className={shell.kicker}>06 · PORTFOLIO DEMO</p>
                <h2 className={shell.sectionTitle}>Selected Work</h2>
              </div>
              <a href="/shop" className={`${shell.meta} mb-1 no-underline hover:opacity-60`}>
                쇼핑몰 데모 →
              </a>
            </div>

            <div className="grid grid-cols-2 max-md:grid-cols-1">
              {(
                [
                  {
                    id: -2,
                    title: "Trouble Shooting",
                    subtitle: "Board UI",
                    description: "Spring Boot · JPA · MySQL",
                    techStack: "Spring Boot · JPA · MySQL",
                    projectUrl: "/community",
                    githubUrl: null,
                    status: "COMPLETED",
                    isFeatured: true,
                    sortOrder: -1,
                  },
                  {
                    id: -1,
                    title: "Product Archive",
                    subtitle: "Commerce UI",
                    description: "Next.js · React · Responsive UI",
                    techStack: "Next.js · React · Responsive UI",
                    projectUrl: "/shop",
                    githubUrl: null,
                    status: "IN PROGRESS",
                    isFeatured: true,
                    sortOrder: -2,
                  },
                  ...projects,
                ] as PortfolioProject[]
              ).map((project, index) => {
                const href =
                  project.id > 0 ? `/projects/${project.id}` : project.projectUrl || "#";
                const isExternal = href.startsWith("http");
                const isHighlight = project.id === -2;

                return (
                  <a
                    key={project.id}
                    href={href}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noreferrer" : undefined}
                    className="group min-h-[280px] border-b border-r border-black/15 p-7 text-[#171713] no-underline transition-colors hover:bg-black/[0.035] max-md:border-r-0 max-sm:min-h-[220px] max-sm:p-5"
                  >
                    <div className={`flex items-center justify-between gap-4 ${shell.meta}`}>
                      <span>
                        {String(index + 1).padStart(2, "0")} ·{" "}
                        {project.subtitle?.toUpperCase() || "PROJECT"}
                      </span>
                      <span>{project.status.replace("_", " ")}</span>
                    </div>
                    <h3 className={`${shell.slideTitle} mt-16 flex flex-wrap items-center gap-3 max-sm:mt-10`}>
                      {project.title}
                      {isHighlight ? (
                        <span className="rounded-full border border-black/30 px-2 py-1 text-[10px] font-bold tracking-[0.1em]">
                          MAIN FOCUS
                        </span>
                      ) : null}
                    </h3>
                    <p className={`${shell.meta} mt-4`}>
                      {project.techStack || project.description}
                    </p>
                    <div className={`${shell.meta} mt-8 transition-transform group-hover:translate-x-2`}>
                      OPEN PROJECT →
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        <section id="contact" className={`${shell.sectionCompact} pb-[4.5rem]`}>
          <div className={`${shell.inset} border-t border-black pt-7`}>
            <p className={shell.kicker}>CONTACT</p>
            <div className="mt-8 flex items-end justify-between gap-10 max-md:flex-col max-md:items-start">
              <h2 className={`${shell.sectionTitle} !max-w-none text-[clamp(36px,6vw,72px)] leading-[1.05]`}>
                LET&apos;S
                <br />
                WORK TOGETHER.
              </h2>
              <div className="flex flex-col items-end gap-3 max-md:items-start">
                {profile.email ? (
                  <a href={`mailto:${profile.email}`} className={`${shell.meta} border-b border-black pb-1 no-underline`}>
                    {profile.email}
                  </a>
                ) : null}
                {profile.githubUrl ? (
                  <a
                    href={profile.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`${shell.meta} border-b border-black pb-1 tracking-[0.08em] no-underline`}
                  >
                    GITHUB ↗
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
