import Header from "../components/header/Header";
import Footer from "../components/layout/Footer";
import { fetchProjects, fetchResume, type PortfolioProject, type ResumeData } from "../lib/api";

export const dynamic = "force-dynamic";

const fallback: ResumeData = {
  profile: {
    name: "김선우",
    jobTitle: "Backend / Full-stack Developer",
    githubUrl: "https://github.com/KimSunWooo",
    shortIntro:
      "Java를 중심으로 웹 서비스를 개발하고, 데이터베이스부터 화면까지 서비스의 전체 흐름을 이해하며 구현하는 개발자 김선우입니다.",
  },
  skills: [
    { id: 1, name: "Java", category: "Backend", level: "Intermediate", sortOrder: 1 },
    { id: 2, name: "Spring", category: "Backend", level: "Intermediate", sortOrder: 2 },
    { id: 3, name: "MySQL", category: "Database", level: "Intermediate", sortOrder: 3 },
    { id: 4, name: "JavaScript", category: "Frontend", level: "Intermediate", sortOrder: 4 },
    { id: 5, name: "React", category: "Frontend", level: "Intermediate", sortOrder: 5 },
    { id: 6, name: "Next.js", category: "Frontend", level: "Intermediate", sortOrder: 6 },
  ],
  experiences: [
    {
      id: 1,
      companyName: "Career",
      position: "웹 서비스 개발 및 유지보수",
      startDate: "2023-01-01",
      endDate: "2025-01-01",
      description:
        "Java 기반 웹 개발 업무를 수행하며 서버 기능 구현, 데이터 처리, 화면 연동 등 서비스 개발 전반을 경험했습니다.",
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
      title: "꾸준히 이해하고, 끝까지 구현합니다.",
      content:
        "새로운 기술을 빠르게 사용하는 것보다 왜 필요한지 이해한 뒤 실제 서비스에 안정적으로 적용하는 과정을 중요하게 생각합니다.\n\n백엔드 개발을 중심으로 프론트엔드와 데이터베이스까지 함께 다루며 기능이 사용자에게 전달되기까지의 전체 과정을 경험하고 있습니다.",
      sortOrder: 1,
    },
  ],
};

function formatPeriod(start?: string | null, end?: string | null) {
  const fmt = (value?: string | null) => (value ? value.slice(0, 7).replace("-", ".") : "");
  const left = fmt(start);
  const right = end ? fmt(end) : "PRESENT";
  return left || right ? `${left} — ${right}` : "";
}

export default async function Home() {
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
      resume = fetched;
    }
  } catch {
    // 개발 중 백엔드가 꺼져 있어도 메인 화면은 확인할 수 있도록 fallback 유지
  }

  let projects: PortfolioProject[] = [];
  try {
    projects = await fetchProjects(true);
  } catch {
    projects = [];
  }

  const profile = resume.profile ?? fallback.profile!;
  const displayName = profile.name || "김선우";
  const englishName = displayName === "김선우" ? ["KIM", "SUN WOO"] : [displayName, ""];

  const BACKEND_BASE_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL ??
    "http://localhost:8080";

  const profileImageUrl = profile.profileImage
    ? profile.profileImage.startsWith("http")
      ? profile.profileImage
      : `${BACKEND_BASE_URL}${profile.profileImage}`
    : null;

  return (
    <>
      <Header />
      <main className="pt-[76px] max-sm:pt-[62px]">
        <section id="about" className="min-h-[calc(10vh-76px)] border-b border-black/10 px-7 py-[86px] max-sm:min-h-0 max-sm:px-4 max-sm:py-14">
          <div className="mx-auto flex min-h-[620px] max-w-[1440px] flex-col justify-between max-sm:min-h-[560px]">
            <div className="flex items-start justify-between gap-8 text-[10px] tracking-[0.14em] text-[#777] max-sm:flex-col max-sm:gap-2">
              <span>PORTFOLIO · 2026</span>
              <span>{profile.jobTitle?.toUpperCase() ?? "BACKEND / FULL-STACK DEVELOPER"}</span>
            </div>

            <div className="py-16 max-sm:py-14">
              <p className="mb-5 text-[30px] max-sm:text-[20px] tracking-[0.18em] text-[#777]">
                DEVELOPER
              </p>

              <div className="grid grid-cols-[1fr_360px] items-end gap-16 max-lg:grid-cols-[1fr_280px] max-md:grid-cols-1 max-md:gap-10">

                {/* NAME - 모바일 최소 크기 42px로 축소 */}
                <h1 className="text-[clamp(42px,10vw,150px)] font-medium leading-[0.9] tracking-[-0.07em] text-[#111]">
                  {englishName[0]}

                  {englishName[1] && (
                    <>
                      <br />
                      {englishName[1]}
                    </>
                  )}
                </h1>

                {/* PROFILE IMAGE */}
                {profileImageUrl && (
                  <div className="flex justify-end max-md:justify-start">
                    <div className="relative w-full max-w-[320px] overflow-hidden max-md:max-w-[240px]">
                      <img
                        src={profileImageUrl}
                        alt={profile.name ?? "Profile"}
                        className="aspect-[3/4] w-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-10 flex flex-wrap items-end justify-between gap-8 border-t border-black pt-5">
                <p className="whitespace-pre-wrap max-w-[680px] text-[17px] leading-[1.75] tracking-[-0.03em] max-sm:text-[14px]">
                  {profile.shortIntro}
                </p>

                <a
                  href="#experience"
                  className="text-[10px] tracking-[0.16em] text-[#111] no-underline hover:opacity-50"
                >
                  SCROLL TO RESUME ↓
                </a>
              </div>
            </div>

            <div className="grid grid-cols-4 border-y border-black/15 max-md:grid-cols-2">
              {[
                ["FOCUS", profile.jobTitle ?? "Backend"],
                ["SKILLS", `${resume.skills.length} ITEMS`],
                ["DATABASE", "MySQL"],
                ["LOCATION", "Korea"],
              ].map(([label, value]) => (
                <div key={label} className="min-h-[102px] border-r border-black/15 px-5 py-5 last:border-r-0 max-md:border-b max-md:odd:border-r max-md:even:border-r-0 max-sm:p-4">
                  <div className="text-[9px] tracking-[0.14em] text-[#888]">{label}</div>
                  <div className="mt-8 text-[15px] max-sm:text-[13px] tracking-[-0.02em]">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="skills" className="px-7 py-[120px] max-sm:px-4 max-sm:py-16">
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-16 grid grid-cols-[220px_1fr] gap-10 max-md:grid-cols-1 max-md:gap-5 max-sm:mb-10">
              <p className="text-[25px] max-sm:text-[18px] tracking-[0.16em] text-[#777]">01 · SKILLS</p>
              {/* 모바일 최소 크기 28px로 축소 */}
              <h2 className="max-w-[900px] text-[clamp(28px,5.2vw,78px)] font-normal leading-[1.1] tracking-[-0.055em]">
                기술은 목적이 아니라,<br />문제를 해결하기 위한 도구라고 생각합니다.
              </h2>
            </div>

            <div className="flex flex-wrap gap-2 border-y border-black/15 py-7 max-sm:py-5">
              {resume.skills.map((skill) => (
                <span key={skill.id} className="rounded-full border border-[#bbb] px-4 py-2 text-[11px] max-sm:text-[10px] tracking-[0.05em]">
                  {skill.name}{skill.category ? ` · ${skill.category}` : ""}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section id="experience" className="bg-[#f4f3f1] px-7 py-[120px] max-sm:px-4 max-sm:py-16">
          <div className="mx-auto max-w-[1440px]">
            <div className="grid grid-cols-[220px_1fr] gap-10 max-md:grid-cols-1 max-md:gap-5">
              <p className="text-[25px] max-sm:text-[18px] tracking-[0.16em] text-[#777]">02 · EXPERIENCE</p>
              <div>
                {/* 모바일 최소 크기 32px로 축소 */}
                <h2 className="text-[clamp(32px,6vw,88px)] font-normal tracking-[-0.06em]">Career</h2>
                <div className="mt-14 max-sm:mt-8 border-t border-black">
                  {resume.experiences.map((item) => (
                    <div key={item.id} className="grid grid-cols-[180px_1fr] gap-8 border-b border-black/15 py-8 max-md:grid-cols-1 max-md:gap-3 max-sm:py-6">
                      <div className="text-[11px] tracking-[0.06em] text-[#666]">{formatPeriod(item.startDate, item.endDate)}</div>
                      <div>
                        <p className="mb-2 text-[15px] max-sm:text-[13px] tracking-[0.12em] text-[#777]">{item.companyName}</p>
                        <h3 className="text-[20px] max-sm:text-[18px] tracking-[-0.03em]">{item.position}</h3>
                        {item.description && <p className="mt-4 max-w-[720px] whitespace-pre-line text-[13px] max-sm:text-[12px] leading-[1.8] text-[#555]">{item.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="education" className="px-7 py-[120px] max-sm:px-4 max-sm:py-16">
          <div className="mx-auto max-w-[1440px]">
            <div className="grid grid-cols-[220px_1fr] gap-10 max-md:grid-cols-1 max-md:gap-5">
              <p className="text-[25px] max-sm:text-[18px] tracking-[0.16em] text-[#777]">03 · EDUCATION</p>
              <div className="border-t border-black">
                {resume.educations.map((item) => (
                  <div key={item.id} className="grid grid-cols-[1fr_auto] gap-8 border-b border-black/15 py-8 max-sm:grid-cols-1 max-sm:gap-4 max-sm:py-6">
                    <div>
                      <h2 className="text-[28px] max-sm:text-[20px] tracking-[-0.04em]">{item.schoolName}</h2>
                      <p className="mt-3 text-[12px] max-sm:text-[11px] text-[#666]">
                        {[item.major, item.description, formatPeriod(item.startDate, item.endDate)].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <span className="text-[10px] tracking-[0.12em] text-[#777]">EDUCATION</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="introduction" className="border-y border-black/10 bg-[#151515] px-7 py-[120px] text-white max-sm:px-4 max-sm:py-16">
          <div className="mx-auto max-w-[1440px]">
            <p className="text-[25px] max-sm:text-[18px] tracking-[0.16em] text-white/50">04 · INTRODUCTION</p>
            <div className="mt-14 max-sm:mt-8 space-y-20 max-sm:space-y-12">
              {resume.introductions.map((item) => (
                <div key={item.id} className="grid grid-cols-[1.2fr_0.8fr] gap-20 max-lg:grid-cols-1 max-lg:gap-6">
                  {/* 모바일 최소 크기 28px로 축소 */}
                  <h2 className="text-[clamp(28px,6vw,86px)] font-normal leading-[1.1] tracking-[-0.06em]">
                    {item.title ?? "Introduction"}
                  </h2>
                  <p className="whitespace-pre-line text-[14px] max-sm:text-[13px] leading-[1.8] text-white/72">{item.content}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="projects" className="px-7 py-[120px] max-sm:px-4 max-sm:py-16">
          <div className="mx-auto max-w-[1440px]">
            <div className="flex items-end justify-between gap-8 border-b border-black pb-6 max-sm:pb-4">
              <div>
                <p className="mb-4 text-[25px] max-sm:text-[18px] tracking-[0.16em] text-[#777]">
                  05 · PORTFOLIO DEMO
                </p>
                {/* 모바일 최소 크기 32px로 축소 */}
                <h2 className="text-[clamp(32px,6vw,84px)] font-normal tracking-[-0.06em]">
                  Selected Work
                </h2>
              </div>

              <a
                href="/shop"
                className="mb-2 text-[10px] tracking-[0.14em] text-[#111] no-underline hover:opacity-50"
              >
                VIEW DEMO →
              </a>
            </div>

            <div className="grid grid-cols-2 max-md:grid-cols-1">
              {(
                [
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
                  ...projects,
                ] as PortfolioProject[]
              ).map((project, index) => {
                const href =
                project.id > 0
                  ? `/projects/${project.id}`
                  : project.projectUrl || "#";

                const isExternal = href.startsWith("http");

                return (
                  <a
                    key={project.id}
                    href={href}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noreferrer" : undefined}
                    className="group min-h-[310px] max-sm:min-h-[220px] border-b border-r border-black/15 p-7 max-sm:p-5 text-[#111] no-underline max-md:border-r-0"
                  >
                    <div className="flex items-center justify-between gap-4 text-[10px] tracking-[0.12em] text-[#777]">
                      <span>
                        {String(index + 1).padStart(2, "0")} ·{" "}
                        {project.subtitle?.toUpperCase() || "PROJECT"}
                      </span>

                      <span>
                        {project.status.replace("_", " ")}
                      </span>
                    </div>

                    <h3 className="mt-24 max-sm:mt-12 text-[30px] max-sm:text-[22px] tracking-[-0.04em]">
                      {project.title}
                    </h3>

                    <p className="mt-4 text-[12px] max-sm:text-[11px] leading-6 max-sm:leading-5 text-[#666]">
                      {project.techStack || project.description}
                    </p>

                    <div className="mt-8 max-sm:mt-6 text-[11px] max-sm:text-[10px] transition-transform group-hover:translate-x-2">
                      OPEN PROJECT →
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        <section id="contact" className="px-7 pb-[80px] pt-[40px] max-sm:px-4 max-sm:pb-[60px] max-sm:pt-[20px]">
          <div className="mx-auto max-w-[1440px] border-t border-black pt-7 max-sm:pt-5">
            <p className="text-[25px] max-sm:text-[18px] tracking-[0.16em] text-[#777]">CONTACT</p>
            <div className="mt-10 max-sm:mt-6 flex items-end justify-between gap-10 max-md:flex-col max-md:items-start max-md:gap-6">
              {/* 모바일 최소 크기 36px로 축소 */}
              <h2 className="text-[clamp(36px,8vw,120px)] font-medium leading-[1] tracking-[-0.07em]">LET&apos;S<br />WORK TOGETHER.</h2>
              <div className="flex flex-col items-end gap-3 text-[12px] max-sm:text-[11px] max-md:items-start">
                {profile.email && <a href={`mailto:${profile.email}`} className="border-b border-black pb-1 text-[#111] no-underline">{profile.email}</a>}
                {profile.githubUrl && <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="border-b border-black pb-1 tracking-[0.08em] text-[#111] no-underline">GITHUB ↗</a>}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
