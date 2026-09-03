"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  fetchCommunityPost,
  updateCommunityPost,
  type CommunityPostDetail,
  type CommunityCategory,
} from "../../lib/api";
// 💡 어제 만든 useAuthStore 경로를 프로젝트에 맞게 import 해주세요.
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
  const user = useAuthStore((state) => state.isAdmin);
  // 💡 본인의 authStore 구조에 맞게 관리자 여부를 판단하세요. 
  // 예: user?.role === 'ADMIN' 또는 user?.isAdmin === true
  const isAdmin = user

  // 공통 상태 (데이터 및 에러)
  const [post, setPost] = useState<CommunityPostDetail | null>(null);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 수정 폼을 위한 폼 상태
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
        
        {/* 💡 조건 추가: 수정 중이 아니면서(AND) 관리자일 때만 노출 */}
        {!isEditing && isAdmin && (
          <button 
            onClick={handleEditClick} 
            className="text-blue-600 hover:underline transition-colors"
          >
            EDIT POST
          </button>
        )}
      </div>

      <article className="mx-auto mt-[54px] max-w-[960px] max-sm:mt-[38px]">
        {isEditing ? (
          /* =========================================
             모드 1: EDIT MODE (수정 폼) - 코드는 이전과 동일
             ========================================= */
          <form onSubmit={handleUpdateSubmit} className="border-t border-black pt-7">
            {/* ... 기존 폼 내용과 완전 동일하므로 스크롤을 줄이기 위해 생략 없이 그대로 사용하시면 됩니다 ... */}
            {/* (위 응답의 form 태그 내부 구조 복사/붙여넣기) */}
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
             모드 2: READ MODE (일반 읽기 뷰) - 코드는 이전과 동일
             ========================================= */
          <>
            {/* ... 기존 읽기 뷰 내용 ... */}
          </>
        )}
      </article>
    </section>
  );
}