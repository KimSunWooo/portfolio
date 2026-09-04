"use client";

import { SyntheticEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createCommunityPost,
  type CommunityCategory,
} from "../../lib/api";
import { useAuthStore } from "../../store/useAuthStore";

export default function CommunityWriteForm() {
  const router = useRouter();
  
  const { isAdmin } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  // 폼 상태들
  const [category, setCategory] = useState<CommunityCategory | "TECH">("TECH");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("ADMIN");
  const [isPinned, setIsPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [occurrenceDate, setOccurrenceDate] = useState(new Date().toISOString().split("T")[0]);
  const [severity, setSeverity] = useState("HIGH");
  const [status, setStatus] = useState("RESOLVED"); 
  const [techStack, setTechStack] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [situation, setSituation] = useState("");
  const [content, setContent] = useState(""); // 💡 순수 해결 과정만 담기 위한 상태

  useEffect(() => {
    setIsChecking(false);
    if (!isAdmin) {
      alert("관리자만 접근할 수 있는 페이지입니다.");
      router.replace("/community");
    }
  }, [isAdmin, router]);

  async function handleSubmit(event: SyntheticEvent) {
    event.preventDefault();
    setError("");

    if (!title.trim() || !content.trim()) {
      setError("제목과 상세 내용을 입력해 주세요.");
      return;
    }

    try {
      setSubmitting(true);
      
      // 💡 거대한 문자열 조립을 제거하고 개별 데이터 객체로 구성합니다.
      const postData: any = {
        category: category as CommunityCategory,
        title: title.trim(),
        content: content.trim(), // '상세 내용 및 해결 과정' 순수 텍스트만 전송
        author: author.trim() || "ADMIN",
        isPinned,
      };

      // 💡 선택된 카테고리가 TECH일 때만 추가 메타데이터 필드들을 함께 보냅니다.
      if (category === "TECH") {
        postData.occurrenceDate = occurrenceDate;
        postData.status = status;
        postData.severity = severity;
        postData.techStack = techStack;
        postData.errorMessage = errorMessage;
        postData.situation = situation;
      }

      const saved = await createCommunityPost(postData);
      
      router.push(`/community/${saved.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "게시글 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

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

          {/* 💡 TECH 카테고리일 때만 트러블슈팅 폼 렌더링 */}
          {category === "TECH" && (
            <>
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
                    <option value="DISCOVERED">🚨 에러 발견</option>
                    <option value="IN_PROGRESS">🚧 슈팅 중</option>
                    <option value="RESOLVED">✅ 해결 완료</option>
                  </select>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="h-11 w-full border border-black/20 bg-white px-3 text-[12px] outline-none focus:border-black"
                  >
                    <option value="HIGH">중요도: 상 (치명적)</option>
                    <option value="MEDIUM">중요도: 중 (기능 오작동)</option>
                    <option value="LOW">중요도: 하 (단순 경고)</option>
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
                  placeholder="어떤 상황에서 해당 이슈가 발생했는지 기재해 주세요."
                  className="h-[120px] resize-y border border-black/20 p-4 text-[12px] leading-7 outline-none focus:border-black"
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-[140px_1fr] items-start border-b border-black/10 py-5 max-sm:grid-cols-1 max-sm:gap-3">
            <label htmlFor="content" className="pt-3 text-[10px] tracking-[0.08em] text-[#777]">
              {category === "TECH" ? "RESOLUTION" : "CONTENT"}
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={category === "TECH" ? "원인 분석 및 해결 과정을 상세히 적어주세요." : "내용을 입력해 주세요."}
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
              className="grid h-12 min-w-[140px] place-items-center border border-black text-[10px] tracking-[0.08em] text-black no-underline hover:bg-gray-50 transition-colors"
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