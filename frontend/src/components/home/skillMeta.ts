export type SkillVisual = {
  logoSrc: string;
  logoAlt: string;
  usage: string;
};

const DEFAULT_USAGE = "포트폴리오 서비스 구현과 검증에 사용";

const BY_NAME: Record<string, SkillVisual> = {
  java: {
    logoSrc: "https://cdn.simpleicons.org/openjdk/437291",
    logoAlt: "Java",
    usage: "Spring Boot API와 쇼핑몰·이력 서버 로직",
  },
  spring: {
    logoSrc: "https://cdn.simpleicons.org/spring/6DB33F",
    logoAlt: "Spring",
    usage: "Security·JWT 인증과 JPA 데이터 접근",
  },
  "spring boot": {
    logoSrc: "https://cdn.simpleicons.org/springboot/6DB33F",
    logoAlt: "Spring Boot",
    usage: "REST API·Flyway·검증 프로파일 구성",
  },
  mysql: {
    logoSrc: "https://cdn.simpleicons.org/mysql/4479A1",
    logoAlt: "MySQL",
    usage: "장바구니·주문·이력·시드 데이터 저장",
  },
  mariadb: {
    logoSrc: "https://cdn.simpleicons.org/mariadb/003545",
    logoAlt: "MariaDB",
    usage: "실무 서비스 조회·수정 SQL 유지보수",
  },
  javascript: {
    logoSrc: "https://cdn.simpleicons.org/javascript/F7DF1E",
    logoAlt: "JavaScript",
    usage: "관리자 화면과 쇼핑몰 클라이언트 로직",
  },
  typescript: {
    logoSrc: "https://cdn.simpleicons.org/typescript/3178C6",
    logoAlt: "TypeScript",
    usage: "Next.js 프론트 API 타입과 상태 관리",
  },
  react: {
    logoSrc: "https://cdn.simpleicons.org/react/61DAFB",
    logoAlt: "React",
    usage: "관리자 CMS·장바구니·구매 분석 UI",
  },
  "next.js": {
    logoSrc: "https://cdn.simpleicons.org/nextdotjs/000000",
    logoAlt: "Next.js",
    usage: "포트폴리오 SSR과 쇼핑몰 라우팅",
  },
  nextjs: {
    logoSrc: "https://cdn.simpleicons.org/nextdotjs/000000",
    logoAlt: "Next.js",
    usage: "포트폴리오 SSR과 쇼핑몰 라우팅",
  },
  redis: {
    logoSrc: "https://cdn.simpleicons.org/redis/DC382D",
    logoAlt: "Redis",
    usage: "상품 목록 캐시와 무효화 검증",
  },
  docker: {
    logoSrc: "/home/skills/docker.svg",
    logoAlt: "Docker",
    usage: "verify·배포 컨테이너와 블루·그린 전환",
  },
  nginx: {
    logoSrc: "https://cdn.simpleicons.org/nginx/009639",
    logoAlt: "Nginx",
    usage: "리버스 프록시와 정적 프론트 서빙",
  },
  aws: {
    logoSrc: "/home/skills/amazonaws.svg",
    logoAlt: "AWS",
    usage: "EC2·RDS·S3 기반 운영 배포",
  },
  "aws ec2": {
    logoSrc: "/home/skills/amazonec2.svg",
    logoAlt: "AWS EC2",
    usage: "운영 서버 실행과 배포 호스트",
  },
  "aws ec2 cloud": {
    logoSrc: "/home/skills/amazonec2.svg",
    logoAlt: "AWS EC2",
    usage: "운영 서버 실행과 배포 호스트",
  },
  ec2: {
    logoSrc: "/home/skills/amazonec2.svg",
    logoAlt: "AWS EC2",
    usage: "운영 서버 실행과 배포 호스트",
  },
  "aws s3": {
    logoSrc: "/home/skills/amazons3.svg",
    logoAlt: "AWS S3",
    usage: "프로필·상품 이미지 저장",
  },
  "aws s3 storage": {
    logoSrc: "/home/skills/amazons3.svg",
    logoAlt: "AWS S3",
    usage: "프로필·상품 이미지 저장",
  },
  s3: {
    logoSrc: "/home/skills/amazons3.svg",
    logoAlt: "AWS S3",
    usage: "프로필·상품 이미지 저장",
  },
  kafka: {
    logoSrc: "https://cdn.simpleicons.org/apachekafka/231F20",
    logoAlt: "Kafka",
    usage: "상품 상세 조회 이벤트 집계 학습",
  },
  rabbitmq: {
    logoSrc: "https://cdn.simpleicons.org/rabbitmq/FF6600",
    logoAlt: "RabbitMQ",
    usage: "비밀번호 변경 메일 Outbox 발행",
  },
  jpa: {
    logoSrc: "https://cdn.simpleicons.org/hibernate/59666C",
    logoAlt: "JPA",
    usage: "엔티티 매핑과 Fetch Join 조회 개선",
  },
  hibernate: {
    logoSrc: "https://cdn.simpleicons.org/hibernate/59666C",
    logoAlt: "Hibernate",
    usage: "엔티티 매핑과 Fetch Join 조회 개선",
  },
  git: {
    logoSrc: "/home/skills/git.svg",
    logoAlt: "Git",
    usage: "소스 버전 관리와 브랜치 전략",
  },
  github: {
    logoSrc: "/home/github-logo.png",
    logoAlt: "GitHub",
    usage: "포트폴리오 저장소와 Actions PR·배포",
  },
  "github actions": {
    logoSrc: "/home/skills/githubactions.svg",
    logoAlt: "GitHub Actions",
    usage: "PR 검사와 운영 배포 워크플로",
  },
  "git action": {
    logoSrc: "/home/skills/githubactions.svg",
    logoAlt: "GitHub Actions",
    usage: "PR 검사와 운영 배포 워크플로",
  },
  "git actions": {
    logoSrc: "/home/skills/githubactions.svg",
    logoAlt: "GitHub Actions",
    usage: "PR 검사와 운영 배포 워크플로",
  },
  python: {
    logoSrc: "/home/skills/python.svg",
    logoAlt: "Python",
    usage: "캐시 측정·배포 mock 자동화 스크립트",
  },
  linux: {
    logoSrc: "/home/skills/linux.svg",
    logoAlt: "Linux",
    usage: "서버 상태 점검과 crontab 운영",
  },
  html: {
    logoSrc: "https://cdn.simpleicons.org/html5/E34F26",
    logoAlt: "HTML",
    usage: "포트폴리오·관리자 마크업 구성",
  },
  css: {
    logoSrc: "https://cdn.simpleicons.org/css/663399",
    logoAlt: "CSS",
    usage: "홈·쇼핑몰 반응형 레이아웃",
  },
  "node.js": {
    logoSrc: "https://cdn.simpleicons.org/nodedotjs/339933",
    logoAlt: "Node.js",
    usage: "프론트 빌드·브라우저 검증 스크립트",
  },
};

function normalizeSkillKey(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[_/]+/g, " ")
    .replace(/\s+/g, " ");
}

export function skillVisual(name: string, category?: string | null): SkillVisual {
  const key = normalizeSkillKey(name);
  const found = BY_NAME[key];
  if (found) return found;

  if (key.includes("ec2")) return BY_NAME["aws ec2"];
  if (key.includes("s3")) return BY_NAME["aws s3"];
  if (key.includes("action")) return BY_NAME["github actions"];
  if (key.includes("docker")) return BY_NAME.docker;
  if (key.includes("aws")) return BY_NAME.aws;
  if (key === "git" || key.startsWith("git ")) return BY_NAME.git;

  const slug = key.replace(/\s+/g, "").replace(/\./g, "dot");
  return {
    logoSrc: `https://cdn.simpleicons.org/${encodeURIComponent(slug)}/5e5759`,
    logoAlt: name,
    usage: category ? `${category} 영역에서 ${DEFAULT_USAGE}` : DEFAULT_USAGE,
  };
}

export function skillInitials(name: string) {
  const parts = name.trim().split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
