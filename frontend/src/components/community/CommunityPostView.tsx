"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchCommunityPost, type CommunityPostDetail } from "../../lib/api";

function formatDate(value: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

// 상태와 중요도 매핑용 헬퍼 객체
const STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  DISCOVERED: { label: "🚨 에러 발견", bg: "bg-red-50", text: "text-red-600" },
  IN_PROGRESS: { label: "🚧 슈팅 중", bg: "bg-orange-50", text: "text-orange-600" },
  RESOLVED: { label: "✅ 해결 완료", bg: "bg-green-50", text: "text-green-600" },
};

const SEVERITY_MAP: Record<string, string> = {
  HIGH: "상 (치명적)",
  MEDIUM: "중 (기능 오작동)",
  LOW: "하 (단순 경고)",
};

export default function CommunityPostView({ id }: { id: string }) {
  const [post, setPost] = useState<CommunityPostDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCommunityPost(id)
      .then(setPost)
      .catch((err: Error) => setError(err.message));
  }, [id]);

  if (error) {
    return <section className="px-7 pb-24 pt-[160px] text-center text-[12px] text-[#888]">{error}</section>;
  }

  if (!post) {
    return <section className="px-7 pb-24 pt-[160px] text-center text-[11px] tracking-[0.08em] text-[#999]">LOADING...</section>;
  }

  const isTechLog = post.category === "TECH";
  const statusInfo = post.status ? STATUS_MAP[post.status] : null;

  return (
    <section className="px-7 pb-24 pt-[132px] max-sm:px-[14px] max-sm:pt-[105px]">
      <div className="text-[9px] tracking-[0.08em] text-[#999]">HOME / COMMUNITY / {post.category}</div>
      <article className="mx-auto mt-[54px] max-w-[960px] max-sm:mt-[38px]">
        
        {/* 헤더 영역 */}
        <header className="border-y border-black py-7">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[9px] tracking-[0.1em] text-[#888]">
              {post.isPinned ? "PINNED / " : ""}{post.category}
            </p>
            {/* TECH 카테고리일 경우 상태 뱃지 표시 */}
            {isTechLog && statusInfo && (
              <span className={`px-2 py-1 text-[10px] tracking-wider ${statusInfo.bg} ${statusInfo.text}`}>
                {statusInfo.label}
              </span>
            )}
          </div>
          <h1 className="mt-4 text-[26px] font-normal leading-[1.35] tracking-[-0.03em] max-sm:text-[22px]">
            {post.title}
          </h1>
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-[10px] text-[#888]">
            <span>{post.author}</span>
            <span>{formatDate(post.createdAt)}</span>
            <span>VIEW {post.viewCount ?? 0}</span>
          </div>
        </header>

        {/* 본문 영역 */}
        <div className="min-h-[300px] border-b border-black/10 py-10">
          
          {/* TECH 트러블슈팅 전용 뷰 */}
          {isTechLog ? (
            <div className="flex flex-col gap-10">
              {/* 메타데이터 박스 */}
              <div className="grid grid-cols-2 gap-4 border border-black/10 bg-gray-50/50 p-6 max-sm:grid-cols-1">
                <div>
                  <dt className="text-[9px] tracking-[0.1em] text-[#999]">발생 일자</dt>
                  <dd className="mt-1 text-[12px] text-[#333]">{post.occurrenceDate || "미기재"}</dd>
                </div>
                <div>
                  <dt className="text-[9px] tracking-[0.1em] text-[#999]">중요도</dt>
                  <dd className="mt-1 text-[12px] text-[#333]">
                    {post.severity ? SEVERITY_MAP[post.severity] : "미기재"}
                  </dd>
                </div>
                <div className="col-span-2 max-sm:col-span-1">
                  <dt className="text-[9px] tracking-[0.1em] text-[#999]">관련 기술 스택</dt>
                  <dd className="mt-1 text-[12px] font-medium text-[#333]">{post.techStack || "미기재"}</dd>
                </div>
              </div>

              {/* 에러 로그 박스 */}
              {post.errorMessage && (
                <section>
                  <h2 className="text-[11px] font-bold tracking-[0.08em] text-[#555]">ERROR LOG</h2>
                  <pre className="mt-3 overflow-x-auto bg-[#1e1e1e] p-5 text-[12px] leading-relaxed text-[#d4d4d4] scrollbar-thin">
                    <code>{post.errorMessage}</code>
                  </pre>
                </section>
              )}

              {/* 발생 상황 */}
              {post.situation && (
                <section>
                  <h2 className="text-[11px] font-bold tracking-[0.08em] text-[#555]">CONTEXT (발생 상황)</h2>
                  <div className="mt-3 whitespace-pre-wrap text-[13px] leading-[2] text-[#333]">
                    {post.situation}
                  </div>
                </section>
              )}

              {/* 해결 과정 (기존 content 활용) */}
              <section>
                <h2 className="text-[11px] font-bold tracking-[0.08em] text-[#555]">RESOLUTION (해결 과정)</h2>
                <div className="mt-3 whitespace-pre-wrap text-[13px] leading-[2] text-[#333]">
                  {post.content}
                </div>
              </section>
            </div>
          ) : (
            
            /* 일반 게시판 (NOTICE, FAQ 등) 뷰 */
            <div className="whitespace-pre-wrap px-2 text-[13px] leading-[2] text-[#333]">
              {post.content}
            </div>
            
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="mt-8 flex justify-end">
          <Link href="/community" className="grid h-12 min-w-[140px] place-items-center border border-black text-[10px] tracking-[0.08em] text-black no-underline hover:bg-gray-50 transition-colors">
            LIST
          </Link>
        </div>
      </article>
    </section>
  );
}