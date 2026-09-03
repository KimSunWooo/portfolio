"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createCommunityPost,
  type CommunityCategory,
} from "../../lib/api";
import { useAuthStore } from "../../store/useAuthStore"; // 💡 Zustand 스토어 경로를 맞춰주세요

export default function CommunityWriteForm() {
  const router = useRouter();
  
  // Zustand 관리자 권한 상태 가져오기
  const { isAdmin } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true); // 클라이언트 렌더링 확인용

  // 기존 폼 상태
  const [category, setCategory] = useState<CommunityCategory | "TECH">("TECH");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("ADMIN");
  const [isPinned, setIsPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // 트러블슈팅 전용 추가 상태
  const [occurrenceDate, setOccurrenceDate] = useState(new Date().toISOString().split("T")[0]); // 기본값: 오늘 날짜
  const [severity, setSeverity] = useState("HIGH");
  const [status, setStatus] = useState("RESOLVED"); 
  const [techStack, setTechStack] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [situation, setSituation] = useState("");
  const [content, setContent] = useState(""); 

  // 권한 체크 및 접근 제어 (클라이언트 마운트 시 실행)
  useEffect(() => {
    setIsChecking(false); // 마운트 완료

    if (!isAdmin) {
      alert("관리자만 접근할 수 있는 페이지입니다.");
      router.replace("/community"); // 관리자가 아니면 커뮤니티 목록으로 쫓아냄
    }
  }, [isAdmin, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!title.trim() || !content.trim()) {
      setError("제목과 상세 내용을 입력해 주세요.");
      return;
    }

    try {
      setSubmitting(true);
      
      const formattedContent = `
**[발생 일자]** ${occurrenceDate}
**[진행 상태]** ${status === 'RESOLVED' ? '✅ 해결' : status === 'IN_PROGRESS' ? '🚧 슈팅 중' : '🚨 발견'}
**[중요도]** ${severity === 'HIGH' ? '상' : severity === 'MEDIUM' ? '중' : '하'}
**[관련 기술]** ${techStack || '미기재'}

**[에러 메시지]**
\`\`\`text
${errorMessage || '없음'}
\`\`\`

**[발생 상황]**
${situation}

**[상세 내용 및 해결 과정]**
${content}
      `.trim();

      const saved = await createCommunityPost({
        category: category as CommunityCategory,
        title: title.trim(),
        content: formattedContent,
        author: author.trim() || "ADMIN",
        isPinned,
      });
      router.push(`/community/${saved.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "게시글 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  // 권한 확인 중이거나 관리자가 아닐 때는 폼 노출 차단 (화면 깜빡임 방지)
  if (isChecking || !isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-[12px] tracking-[0.08em] text-[#999]">AUTHORIZATION CHECK...</p>
      </div>
    ); 
  }

  return (
    <section className="px-7 pb-24 pt-[132px] max-sm:px-[14px] max-sm:pt-[105px]">
      <div className="text-[9px] tracking-[0.08em] text-[#999]">HOME / COMMUNITY / WRITE</div>
      <div className="mx-auto mt-[54px] max-w-[960px] max-sm:mt-[38px]">
        <div className="border-b border-black pb-7">
          <h1 className="text-[34px] font-normal tracking-[-0.05em] max-sm:text-[27px]">TECH LOG WRITE</h1>
          <p className="mt-3 text-[11px] leading-5 text-[#888]">트러블슈팅 및 기술 로그를 기록해 주세요.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8">
          <div className="grid grid-cols-[140px_1fr] items-center border-b border-black/10 py-5 max-sm:grid-cols-1 max-sm:gap-3">
            <label htmlFor="category" className="text-[10px] tracking-[0.08em] text-[#777]">CATEGORY</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as CommunityCategory | "TECH")}
              className="h-11 border border-black/20 bg-white px-3 text-[12px] outline-none focus:border-black"
            >
              <option value="TECH">TECH (트러블슈팅)</option>
              <option value="NOTICE">NOTICE</option>
              <option value="FAQ">FAQ</option>
              <option value="EVENT">EVENT</option>
              <option value="QNA">QNA</option>
            </select>
          </div>

          <div className="grid grid-cols-[140px_1fr] items-center border-b border-black/10 py-5 max-sm:grid-cols-1 max-sm:gap-3">
            <label htmlFor="title" className="text-[10px] tracking-[0.08em] text-[#777]">TITLE</label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
              placeholder="이슈를 직관적으로 알 수 있는 제목을 입력해 주세요."
              className="h-11 border border-black/20 px-3 text-[12px] outline-none focus:border-black"
            />
          </div>

          <div className="grid grid-cols-[140px_1fr] items-center border-b border-black/10 py-5 max-sm:grid-cols-1 max-sm:gap-3">
            <label htmlFor="occurrenceDate" className="text-[10px] tracking-[0.08em] text-[#777]">DATE</label>
            <input
              type="date"
              id="occurrenceDate"
              value={occurrenceDate}
              onChange={(e) => setOccurrenceDate(e.target.value)}
              className="h-11 w-full max-w-[200px] border border-black/20 bg-white px-3 text-[12px] outline-none focus:border-black"
            />
          </div>

          <div className="grid grid-cols-[140px_1fr] items-center border-b border-black/10 py-5 max-sm:grid-cols-1 max-sm:gap-3">
            <label className="text-[10px] tracking-[0.08em] text-[#777]">STATUS & SEVERITY</label>
            <div className="flex gap-4">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-11 w-full border border-black/20 bg-white px-3 text-[12px] outline-none focus:border-black"
              >
                <option value="DISCOVERED">🚨 에러 발견 (Discovered)</option>
                <option value="IN_PROGRESS">🚧 슈팅 중 (In Progress)</option>
                <option value="RESOLVED">✅ 해결 완료 (Resolved)</option>
              </select>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="h-11 w-full border border-black/20 bg-white px-3 text-[12px] outline-none focus:border-black"
              >
                <option value="HIGH">중요도: 상 (치명적 오류)</option>
                <option value="MEDIUM">중요도: 중 (기능 오작동)</option>
                <option value="LOW">중요도: 하 (단순 UI/경고)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-[140px_1fr] items-center border-b border-black/10 py-5 max-sm:grid-cols-1 max-sm:gap-3">
            <label htmlFor="techStack" className="text-[10px] tracking-[0.08em] text-[#777]">TECH STACK</label>
            <input
              id="techStack"
              value={techStack}
              onChange={(e) => setTechStack(e.target.value)}
              placeholder="예: Next.js, Spring Boot, AWS S3"
              className="h-11 border border-black/20 px-3 text-[12px] outline-none focus:border-black"
            />
          </div>

          <div className="grid grid-cols-[140px_1fr] items-start border-b border-black/10 py-5 max-sm:grid-cols-1 max-sm:gap-3">
            <label htmlFor="errorMessage" className="pt-3 text-[10px] tracking-[0.08em] text-[#777]">ERROR LOG</label>
            <textarea
              id="errorMessage"
              value={errorMessage}
              onChange={(e) => setErrorMessage(e.target.value)}
              placeholder="발생한 에러 코드나 터미널 로그를 붙여넣어 주세요."
              className="h-[120px] resize-y border border-black/20 bg-gray-50 p-4 font-mono text-[12px] leading-6 text-red-600 outline-none focus:border-black"
            />
          </div>

          <div className="grid grid-cols-[140px_1fr] items-start border-b border-black/10 py-5 max-sm:grid-cols-1 max-sm:gap-3">
            <label htmlFor="situation" className="pt-3 text-[10px] tracking-[0.08em] text-[#777]">CONTEXT</label>
            <textarea
              id="situation"
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              placeholder="어떤 상황에서 해당 이슈가 발생했는지 기재해 주세요. (발생 상황)"
              className="h-[120px] resize-y border border-black/20 p-4 text-[12px] leading-7 outline-none focus:border-black"
            />
          </div>

          <div className="grid grid-cols-[140px_1fr] items-start border-b border-black/10 py-5 max-sm:grid-cols-1 max-sm:gap-3">
            <label htmlFor="content" className="pt-3 text-[10px] tracking-[0.08em] text-[#777]">RESOLUTION</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="원인 분석 및 해결 과정을 상세히 적어주세요."
              className="min-h-[300px] resize-y border border-black/20 p-4 text-[12px] leading-7 outline-none focus:border-black"
            />
          </div>

          <div className="grid grid-cols-[140px_1fr] items-center border-b border-black/10 py-5 max-sm:grid-cols-1 max-sm:gap-3">
            <span className="text-[10px] tracking-[0.08em] text-[#777]">OPTION</span>
            <label className="flex w-fit items-center gap-2 text-[11px]">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
              />
              상단 고정 (주요 트러블슈팅 핀)
            </label>
          </div>

          {error && <p className="mt-5 text-[11px] text-red-600">{error}</p>}

          <div className="mt-8 flex justify-end gap-2">
            <Link
              href="/community"
              className="grid h-12 min-w-[140px] place-items-center border border-black text-[10px] tracking-[0.08em] text-black no-underline hover:bg-gray-50"
            >
              CANCEL
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="h-12 min-w-[140px] bg-black px-6 text-[10px] tracking-[0.08em] text-white transition-colors hover:bg-gray-800 disabled:opacity-40"
            >
              {submitting ? "SUBMITTING..." : "SUBMIT LOG"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}