"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  fetchCommunityPost,
  updateCommunityPost,
  //deleteCommunityPost, 
  type CommunityPostDetail,
  type CommunityCategory,
} from "../../lib/api";
import { useAuthStore } from "../../store/useAuthStore";

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
  const router = useRouter();

  // 1. 전역 상태에서 유저 정보 가져오기 (Zustand)
  const isAdmin = useAuthStore((state) => state.isAdmin);

  // 공통 상태
  const [post, setPost] = useState<CommunityPostDetail | null>(null);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 수정 폼 상태
  const [editCategory, setEditCategory] = useState<CommunityCategory | "TECH">("TECH");
  const [editTitle, setEditTitle] = useState("");
  const [editIsPinned, setEditIsPinned] = useState(false);
  const [editContent, setEditContent] = useState("");
  
  // TECH 전용 폼 상태
  const [editOccurrenceDate, setEditOccurrenceDate] = useState("");
  const [editSeverity, setEditSeverity] = useState("HIGH");
  const [editStatus, setEditStatus] = useState("RESOLVED");
  const [editTechStack, setEditTechStack] = useState("");
  const [editErrorMessage, setEditErrorMessage] = useState("");
  const [editSituation, setEditSituation] = useState("");

  useEffect(() => {
    fetchCommunityPost(id)
      .then(setPost)
      .catch((err: Error) => setError(err.message));
  }, [id]);

  const handleEditClick = () => {
    if (!post) return;
    setEditCategory(post.category as CommunityCategory | "TECH");
    setEditTitle(post.title);
    setEditIsPinned(post.isPinned);
    setEditContent(post.content);

    if (post.category === "TECH") {
      setEditOccurrenceDate(post.occurrenceDate ? post.occurrenceDate.split("T")[0] : "");
      setEditSeverity(post.severity || "HIGH");
      setEditStatus(post.status || "RESOLVED");
      setEditTechStack(post.techStack || "");
      setEditErrorMessage(post.errorMessage || "");
      setEditSituation(post.situation || "");
    }
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setError("");
  };

  const handleDelete = async () => {
    if (confirm("정말 이 게시글을 삭제하시겠습니까?")) {
      try {
        await deleteCommunityPost(id);
        router.push("/community");
        router.refresh();
      } catch (err) {
        alert("게시글 삭제에 실패했습니다.");
      }
    }
  };

  async function handleUpdateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!editTitle.trim() || !editContent.trim()) {
      setError("제목과 내용을 입력해 주세요.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        category: editCategory as CommunityCategory,
        title: editTitle.trim(),
        content: editContent.trim(),
        author: post?.author || "ADMIN",
        isPinned: editIsPinned,
        occurrenceDate: editCategory === "TECH" ? editOccurrenceDate : undefined,
        status: editCategory === "TECH" ? editStatus : undefined,
        severity: editCategory === "TECH" ? editSeverity : undefined,
        techStack: editCategory === "TECH" ? editTechStack : undefined,
        errorMessage: editCategory === "TECH" ? editErrorMessage : undefined,
        situation: editCategory === "TECH" ? editSituation : undefined,
      };

      const updatedPost = await updateCommunityPost(id, payload);
      setPost(updatedPost);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "게시글 수정에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  if (error && !isEditing) {
    return <section className="px-7 pb-24 pt-[160px] text-center text-[12px] text-[#888]">{error}</section>;
  }

  if (!post) {
    return <section className="px-7 pb-24 pt-[160px] text-center text-[11px] tracking-[0.08em] text-[#999]">LOADING...</section>;
  }

  const isTechLog = post.category === "TECH";
  const statusInfo = post.status ? STATUS_MAP[post.status] : null;

  return (
    <section className="px-7 pb-24 pt-[132px] max-sm:px-[14px] max-sm:pt-[105px]">
      <div className="flex items-center justify-between text-[9px] tracking-[0.08em] text-[#999]">
        <span>HOME / COMMUNITY / {isEditing ? "EDIT" : post.category}</span>
        
        {/* 관리자 전용 컨트롤 패널 */}
        {!isEditing && isAdmin && (
          <div className="flex gap-4">
            <button 
              onClick={handleEditClick} 
              className="text-blue-600 hover:underline transition-colors"
            >
              EDIT POST
            </button>
            <button 
              onClick={handleDelete} 
              className="text-red-600 hover:underline transition-colors"
            >
              DELETE
            </button>
          </div>
        )}
      </div>

      <article className="mx-auto mt-[54px] max-w-[960px] max-sm:mt-[38px]">
        {isEditing ? (
          /* =========================================
             모드 1: EDIT MODE (수정 폼)
             ========================================= */
          <form onSubmit={handleUpdateSubmit} className="border-t border-black pt-7">
            <div className="grid grid-cols-[140px_1fr] items-center border-b border-black/10 py-5 max-sm:grid-cols-1 max-sm:gap-3">
              <label className="text-[10px] tracking-[0.08em] text-[#777]">CATEGORY</label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value as CommunityCategory | "TECH")}
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
              <label className="text-[10px] tracking-[0.08em] text-[#777]">TITLE</label>
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                maxLength={255}
                className="h-11 border border-black/20 px-3 text-[12px] outline-none focus:border-black"
              />
            </div>

            {/* TECH 전용 필드들 */}
            {editCategory === "TECH" && (
              <>
                <div className="grid grid-cols-[140px_1fr] items-center border-b border-black/10 py-5 max-sm:grid-cols-1 max-sm:gap-3">
                  <label className="text-[10px] tracking-[0.08em] text-[#777]">DATE</label>
                  <input
                    type="date"
                    value={editOccurrenceDate}
                    onChange={(e) => setEditOccurrenceDate(e.target.value)}
                    className="h-11 w-full max-w-[200px] border border-black/20 bg-white px-3 text-[12px] outline-none focus:border-black"
                  />
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center border-b border-black/10 py-5 max-sm:grid-cols-1 max-sm:gap-3">
                  <label className="text-[10px] tracking-[0.08em] text-[#777]">STATUS & SEVERITY</label>
                  <div className="flex gap-4">
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="h-11 w-full border border-black/20 bg-white px-3 text-[12px] outline-none focus:border-black"
                    >
                      <option value="DISCOVERED">🚨 에러 발견</option>
                      <option value="IN_PROGRESS">🚧 슈팅 중</option>
                      <option value="RESOLVED">✅ 해결 완료</option>
                    </select>
                    <select
                      value={editSeverity}
                      onChange={(e) => setEditSeverity(e.target.value)}
                      className="h-11 w-full border border-black/20 bg-white px-3 text-[12px] outline-none focus:border-black"
                    >
                      <option value="HIGH">상 (치명적)</option>
                      <option value="MEDIUM">중 (기능 오작동)</option>
                      <option value="LOW">하 (단순 경고)</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center border-b border-black/10 py-5 max-sm:grid-cols-1 max-sm:gap-3">
                  <label className="text-[10px] tracking-[0.08em] text-[#777]">TECH STACK</label>
                  <input
                    value={editTechStack}
                    onChange={(e) => setEditTechStack(e.target.value)}
                    className="h-11 border border-black/20 px-3 text-[12px] outline-none focus:border-black"
                  />
                </div>
                <div className="grid grid-cols-[140px_1fr] items-start border-b border-black/10 py-5 max-sm:grid-cols-1 max-sm:gap-3">
                  <label className="pt-3 text-[10px] tracking-[0.08em] text-[#777]">ERROR LOG</label>
                  <textarea
                    value={editErrorMessage}
                    onChange={(e) => setEditErrorMessage(e.target.value)}
                    className="h-[120px] resize-y border border-black/20 bg-gray-50 p-4 text-[12px] leading-6 text-red-600 outline-none focus:border-black font-mono"
                  />
                </div>
                <div className="grid grid-cols-[140px_1fr] items-start border-b border-black/10 py-5 max-sm:grid-cols-1 max-sm:gap-3">
                  <label className="pt-3 text-[10px] tracking-[0.08em] text-[#777]">CONTEXT</label>
                  <textarea
                    value={editSituation}
                    onChange={(e) => setEditSituation(e.target.value)}
                    className="h-[120px] resize-y border border-black/20 p-4 text-[12px] leading-7 outline-none focus:border-black whitespace-pre-wrap"
                  />
                </div>
              </>
            )}

            <div className="grid grid-cols-[140px_1fr] items-start border-b border-black/10 py-5 max-sm:grid-cols-1 max-sm:gap-3">
              <label className="pt-3 text-[10px] tracking-[0.08em] text-[#777]">
                {editCategory === "TECH" ? "RESOLUTION" : "CONTENT"}
              </label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[300px] resize-y border border-black/20 p-4 text-[12px] leading-7 outline-none focus:border-black whitespace-pre-wrap"
              />
            </div>

            <div className="grid grid-cols-[140px_1fr] items-center border-b border-black/10 py-5 max-sm:grid-cols-1 max-sm:gap-3">
              <span className="text-[10px] tracking-[0.08em] text-[#777]">OPTION</span>
              <label className="flex w-fit items-center gap-2 text-[11px]">
                <input
                  type="checkbox"
                  checked={editIsPinned}
                  onChange={(e) => setEditIsPinned(e.target.checked)}
                />
                상단 고정
              </label>
            </div>

            {error && <p className="mt-5 text-[11px] text-red-600">{error}</p>}

            <div className="mt-8 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="grid h-12 min-w-[140px] place-items-center border border-black text-[10px] tracking-[0.08em] text-black hover:bg-gray-50 transition-colors"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="h-12 min-w-[140px] bg-blue-600 px-6 text-[10px] tracking-[0.08em] text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
              >
                {submitting ? "SAVING..." : "SAVE CHANGES"}
              </button>
            </div>
          </form>
        ) : (
          /* =========================================
             모드 2: READ MODE (일반 읽기 뷰)
             ========================================= */
          <>
            <header className="border-y border-black py-7">
              <div className="flex items-center justify-between gap-4">
                <p className="text-[9px] tracking-[0.1em] text-[#888]">
                  {post.isPinned ? "PINNED / " : ""}{post.category}
                </p>
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

            <div className="min-h-[300px] border-b border-black/10 py-10">
              {isTechLog ? (
                <div className="flex flex-col gap-10">
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

                  {post.errorMessage && (
                    <section>
                      <h2 className="text-[11px] font-bold tracking-[0.08em] text-[#555]">ERROR LOG</h2>
                      <pre className="mt-3 overflow-x-auto bg-[#1e1e1e] p-5 text-[12px] leading-relaxed text-[#d4d4d4] scrollbar-thin">
                        <code>{post.errorMessage}</code>
                      </pre>
                    </section>
                  )}

                  {post.situation && (
                    <section>
                      <h2 className="text-[11px] font-bold tracking-[0.08em] text-[#555]">CONTEXT (발생 상황)</h2>
                      {/* 💡 whitespace-pre-wrap 적용 */}
                      <div className="mt-3 whitespace-pre-wrap text-[13px] leading-[2] text-[#333]">
                        {post.situation}
                      </div>
                    </section>
                  )}

                  <section>
                    <h2 className="text-[11px] font-bold tracking-[0.08em] text-[#555]">RESOLUTION (해결 과정)</h2>
                    {/* 💡 whitespace-pre-wrap 적용 */}
                    <div className="mt-3 whitespace-pre-wrap text-[13px] leading-[2] text-[#333]">
                      {post.content}
                    </div>
                  </section>
                </div>
              ) : (
                <div className="whitespace-pre-wrap px-2 text-[13px] leading-[2] text-[#333]">
                  {post.content}
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end">
              <Link href="/community" className="grid h-12 min-w-[140px] place-items-center border border-black text-[10px] tracking-[0.08em] text-black no-underline hover:bg-gray-50 transition-colors">
                LIST
              </Link>
            </div>
          </>
        )}
      </article>
    </section>
  );
}