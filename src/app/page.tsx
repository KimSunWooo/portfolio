import Header from "../components/header/Header";
import Footer from "../components/layout/Footer";

const skills = [
  "Java",
  "JavaScript",
  "React",
  "MySQL",
  "HTML5",
  "CSS3",
  "Spring MVC",
  "REST API",
  "Linux",
  "Git",
];

const strengths = [
  {
    no: "01",
    title: "Backend Development",
    text: "Java와 Spring 기반의 서버 개발을 중심으로, 데이터 흐름과 유지보수성을 고려한 기능 구현을 지향합니다.",
  },
  {
    no: "02",
    title: "Database",
    text: "MySQL을 활용한 데이터 모델링과 SQL 작성 경험을 바탕으로 서비스에 필요한 데이터를 구조화합니다.",
  },
  {
    no: "03",
    title: "Frontend Collaboration",
    text: "JavaScript와 React를 활용해 화면을 구현하고, API와 UI가 자연스럽게 연결되는 전체 흐름을 이해하고 있습니다.",
  },
];

export default function Home() {
  return (
    <>
      <Header />
      <main className="pt-[76px] max-sm:pt-[62px]">
        <section id="about" className="min-h-[calc(100vh-76px)] border-b border-black/10 px-7 py-[86px] max-sm:min-h-0 max-sm:px-4 max-sm:py-14">
          <div className="mx-auto flex min-h-[620px] max-w-[1440px] flex-col justify-between max-sm:min-h-[560px]">
            <div className="flex items-start justify-between gap-8 text-[10px] tracking-[0.14em] text-[#777] max-sm:flex-col max-sm:gap-2">
              <span>PORTFOLIO · 2026</span>
              <span>BACKEND / FULL-STACK DEVELOPER</span>
            </div>

            <div className="py-16 max-sm:py-20">
              <p className="mb-5 text-[12px] tracking-[0.18em] text-[#777]">DEVELOPER</p>
              <h1 className="max-w-[1120px] text-[clamp(64px,10vw,150px)] font-medium leading-[0.9] tracking-[-0.07em] text-[#111]">
                KIM<br />SUN WOO
              </h1>
              <div className="mt-10 flex flex-wrap items-end justify-between gap-8 border-t border-black pt-5">
                <p className="max-w-[680px] text-[17px] leading-[1.75] tracking-[-0.03em] max-sm:text-[15px]">
                  Java를 중심으로 웹 서비스를 개발하고, 데이터베이스부터 화면까지 서비스의 전체 흐름을 이해하며 구현하는 개발자 김선우입니다.
                </p>
                <a href="#experience" className="text-[10px] tracking-[0.16em] text-[#111] no-underline hover:opacity-50">SCROLL TO RESUME ↓</a>
              </div>
            </div>

            <div className="grid grid-cols-4 border-y border-black/15 max-md:grid-cols-2">
              {[
                ["FOCUS", "Backend"],
                ["LANGUAGE", "Java"],
                ["DATABASE", "MySQL"],
                ["LOCATION", "Korea"],
              ].map(([label, value]) => (
                <div key={label} className="min-h-[102px] border-r border-black/15 px-5 py-5 last:border-r-0 max-md:border-b max-md:odd:border-r max-md:even:border-r-0">
                  <div className="text-[9px] tracking-[0.14em] text-[#888]">{label}</div>
                  <div className="mt-8 text-[15px] tracking-[-0.02em]">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="skills" className="px-7 py-[120px] max-sm:px-4 max-sm:py-20">
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-16 grid grid-cols-[220px_1fr] gap-10 max-md:grid-cols-1 max-md:gap-5">
              <p className="text-[10px] tracking-[0.16em] text-[#777]">01 · SKILLS</p>
              <h2 className="max-w-[900px] text-[clamp(36px,5.2vw,78px)] font-normal leading-[1.04] tracking-[-0.055em]">
                기술은 목적이 아니라,<br />문제를 해결하기 위한 도구라고 생각합니다.
              </h2>
            </div>

            <div className="flex flex-wrap gap-2 border-y border-black/15 py-7">
              {skills.map((skill) => (
                <span key={skill} className="rounded-full border border-[#bbb] px-4 py-2 text-[11px] tracking-[0.05em]">{skill}</span>
              ))}
            </div>

            <div className="mt-16 grid grid-cols-3 gap-0 border-t border-black max-lg:grid-cols-1">
              {strengths.map((item) => (
                <article key={item.no} className="min-h-[300px] border-b border-r border-black/15 p-7 last:border-r-0 max-lg:min-h-0 max-lg:border-r-0">
                  <div className="text-[10px] text-[#777]">{item.no}</div>
                  <h3 className="mt-16 text-[25px] tracking-[-0.04em] max-lg:mt-10">{item.title}</h3>
                  <p className="mt-5 max-w-[360px] text-[13px] leading-[1.8] text-[#555]">{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="experience" className="bg-[#f4f3f1] px-7 py-[120px] max-sm:px-4 max-sm:py-20">
          <div className="mx-auto max-w-[1440px]">
            <div className="grid grid-cols-[220px_1fr] gap-10 max-md:grid-cols-1 max-md:gap-5">
              <p className="text-[10px] tracking-[0.16em] text-[#777]">02 · EXPERIENCE</p>
              <div>
                <h2 className="text-[clamp(44px,6vw,88px)] font-normal tracking-[-0.06em]">Career</h2>
                <div className="mt-14 border-t border-black">
                  <div className="grid grid-cols-[180px_1fr_130px] gap-8 border-b border-black/15 py-8 max-md:grid-cols-1 max-md:gap-3">
                    <div className="text-[11px] tracking-[0.06em] text-[#666]">2023.01 — 2025.01</div>
                    <div>
                      <h3 className="text-[20px] tracking-[-0.03em]">웹 서비스 개발 및 유지보수</h3>
                      <p className="mt-4 max-w-[720px] text-[13px] leading-[1.8] text-[#555]">
                        Java 기반 웹 개발 업무를 수행하며 서버 기능 구현, 데이터 처리, 화면 연동 등 서비스 개발 전반을 경험했습니다. 요구사항을 기능 단위로 분석하고 기존 코드를 이해한 뒤 안정적으로 개선하는 과정에 집중했습니다.
                      </p>
                    </div>
                    <div className="text-right text-[10px] tracking-[0.12em] text-[#777] max-md:text-left">2 YEARS</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="education" className="px-7 py-[120px] max-sm:px-4 max-sm:py-20">
          <div className="mx-auto max-w-[1440px]">
            <div className="grid grid-cols-[220px_1fr] gap-10 max-md:grid-cols-1 max-md:gap-5">
              <p className="text-[10px] tracking-[0.16em] text-[#777]">03 · EDUCATION</p>
              <div className="border-t border-black">
                <div className="grid grid-cols-[1fr_auto] gap-8 border-b border-black/15 py-8 max-sm:grid-cols-1">
                  <div>
                    <h2 className="text-[28px] tracking-[-0.04em]">경기대학교</h2>
                    <p className="mt-3 text-[12px] text-[#666]">4년제 · 학사 과정</p>
                  </div>
                  <span className="text-[10px] tracking-[0.12em] text-[#777]">EDUCATION</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="introduction" className="border-y border-black/10 bg-[#151515] px-7 py-[120px] text-white max-sm:px-4 max-sm:py-20">
          <div className="mx-auto max-w-[1440px]">
            <p className="text-[10px] tracking-[0.16em] text-white/50">04 · INTRODUCTION</p>
            <div className="mt-14 grid grid-cols-[1.2fr_0.8fr] gap-20 max-lg:grid-cols-1 max-lg:gap-14">
              <h2 className="text-[clamp(42px,6vw,86px)] font-normal leading-[1.06] tracking-[-0.06em]">
                꾸준히 이해하고,<br />끝까지 구현합니다.
              </h2>
              <div className="space-y-6 text-[14px] leading-[1.95] text-white/72">
                <p>새로운 기술을 빠르게 사용하는 것보다, 왜 필요한지 이해한 뒤 실제 서비스에 안정적으로 적용하는 과정을 중요하게 생각합니다.</p>
                <p>백엔드 개발을 중심으로 시작했지만 프론트엔드와 데이터베이스까지 함께 다루며 기능 하나가 사용자에게 전달되기까지의 전체 과정을 경험해 왔습니다.</p>
                <p>문제가 발생했을 때 원인을 단계적으로 좁혀가며 해결하고, 다음 사람이 읽어도 이해하기 쉬운 코드와 구조를 만드는 개발자가 되는 것이 목표입니다.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="projects" className="px-7 py-[120px] max-sm:px-4 max-sm:py-20">
          <div className="mx-auto max-w-[1440px]">
            <div className="flex items-end justify-between gap-8 border-b border-black pb-6">
              <div>
                <p className="mb-4 text-[10px] tracking-[0.16em] text-[#777]">05 · PORTFOLIO DEMO</p>
                <h2 className="text-[clamp(42px,6vw,84px)] font-normal tracking-[-0.06em]">Selected Work</h2>
              </div>
              <a href="/shop" className="mb-2 text-[10px] tracking-[0.14em] text-[#111] no-underline hover:opacity-50">VIEW DEMO →</a>
            </div>
            <div className="grid grid-cols-2 max-md:grid-cols-1">
              <a href="/shop" className="group min-h-[310px] border-b border-r border-black/15 p-7 text-[#111] no-underline max-md:border-r-0">
                <div className="text-[10px] tracking-[0.12em] text-[#777]">01 · COMMERCE UI</div>
                <h3 className="mt-24 text-[30px] tracking-[-0.04em]">Product Archive</h3>
                <p className="mt-4 text-[12px] text-[#666]">Next.js · React · Responsive UI</p>
                <div className="mt-8 text-[11px] transition-transform group-hover:translate-x-2">OPEN PROJECT →</div>
              </a>
              <a href="/community" className="group min-h-[310px] border-b border-black/15 p-7 text-[#111] no-underline">
                <div className="text-[10px] tracking-[0.12em] text-[#777]">02 · BOARD UI</div>
                <h3 className="mt-24 text-[30px] tracking-[-0.04em]">Community Board</h3>
                <p className="mt-4 text-[12px] text-[#666]">List UI · Navigation · Component Design</p>
                <div className="mt-8 text-[11px] transition-transform group-hover:translate-x-2">OPEN PROJECT →</div>
              </a>
            </div>
          </div>
        </section>

        <section id="contact" className="px-7 pb-[80px] pt-[40px] max-sm:px-4">
          <div className="mx-auto max-w-[1440px] border-t border-black pt-7">
            <p className="text-[10px] tracking-[0.16em] text-[#777]">CONTACT</p>
            <div className="mt-10 flex items-end justify-between gap-10 max-md:flex-col max-md:items-start">
              <h2 className="text-[clamp(46px,8vw,120px)] font-medium leading-[0.9] tracking-[-0.07em]">LET&apos;S<br />WORK TOGETHER.</h2>
              <a href="https://github.com/KimSunWooo" target="_blank" rel="noreferrer" className="border-b border-black pb-1 text-[12px] tracking-[0.08em] text-[#111] no-underline">GITHUB ↗</a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
