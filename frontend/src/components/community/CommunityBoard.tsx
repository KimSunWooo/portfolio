"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  fetchCommunityPosts,
  deleteCommunityPost,
  type CommunityCategory,
  type CommunityPostListItem,
} from "../../lib/api";
import { useAuthStore } from "../../store/useAuthStore"; // 💡 Zustand 스토어 임포트

const categories: ("ALL" | CommunityCategory)[] = ["ALL", "NOTICE", "FAQ", "EVENT", "QNA", "TECH"];

function formatDate(value: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export default function CommunityBoard() {
  const router = useRouter();
  const isAdmin = useAuthStore((state) => state.isAdmin); // 💡 관리자 여부 확인

  const [posts, setPosts] = useState<CommunityPostListItem[]>([]);
  const [category, setCategory] = useState<"ALL" | CommunityCategory>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false); // 연타 방지용 상태

  const loadPosts = () => {
    setLoading(true);
    setError("");
    fetchCommunityPosts(category === "ALL" ? undefined : category)
      .then((data) => setPosts(data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPosts();
  }, [category]);

  const postCount = useMemo(() => posts.length, [posts]);

  // 💡 목록에서 개별 삭제하는 핸들러
  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.preventDefault(); // 💡 Link 클릭되어 상세 페이지로 넘어가는 것 방지
    
    if (isDeleting) return; // 이미 삭제 중이면 리턴
    if (!window.confirm("정말 이 게시글을 삭제하시겠습니까?\n복구할 수 없습니다.")) return;

    try {
      setIsDeleting(true);
      await deleteCommunityPost(id);
      alert("삭제되었습니다.");
      loadPosts(); // 목록 새로고침
    } catch (err) {
      alert(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="px-7 pb-16 pt-[132px] max-sm:px-[14px] max-sm:pt-[105px]">
      <div className="text-[9px] tracking-[0.08em] text-[#999]">HOME / COMMUNITY</div>

      <div className="mt-[54px] border-b border-[#161616] pb-7 max-sm:mt-[38px]">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1 className="m-0 text-[34px] font-normal tracking-[-0.05em] max-sm:text-[27px]">COMMUNITY</h1>
            <nav className="mt-7 flex flex-wrap gap-[18px] text-[10px] tracking-[0.06em]">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={category === item ? "text-[#111]" : "text-[#999]"}
                >
                  {item}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-5">
            <span className="text-[9px] text-[#777]">{postCount} POSTS</span>
            {isAdmin && (
              <Link
                href="/community/write"
                className="border border-black px-5 py-3 text-[9px] tracking-[0.1em] text-black no-underline transition hover:bg-black hover:text-white"
              >
                WRITE
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="border-b border-[#ddd]">
        {/* 💡 헤더 그리드 (관리자일 때만 맨 끝에 ADMIN 컬럼 추가) */}
        <div className={`grid border-b border-[#ddd] py-4 text-[9px] tracking-[0.08em] text-[#888] max-md:hidden ${isAdmin ? 'grid-cols-[76px_100px_1fr_110px_70px_60px]' : 'grid-cols-[76px_100px_1fr_110px_70px]'}`}>
          <span>NO.</span><span>TYPE</span><span>TITLE</span><span>DATE</span><span>VIEW</span>
          {isAdmin && <span className="text-right">ADMIN</span>}
        </div>

        {loading && (
          <div className="py-16 text-center text-[11px] tracking-[0.08em] text-[#999]">LOADING...</div>
        )}

        {!loading && error && (
          <div className="py-16 text-center text-[11px] text-[#999]">
            {error}<br />Spring Boot 서버가 실행 중인지 확인해 주세요.
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="py-16 text-center text-[11px] tracking-[0.08em] text-[#999]">NO POSTS</div>
        )}

        {!loading && !error && posts.map((post) => (
          <Link
            key={post.id}
            href={`/community/${post.id}`}
            // 💡 본문 그리드 (관리자일 때만 맨 끝에 삭제 버튼 영역 추가)
            className={`grid items-center border-b border-[#e9e9e9] py-[22px] text-[#111] no-underline transition-opacity hover:opacity-50 max-md:grid-cols-[56px_82px_1fr_92px] max-md:[&>*:nth-last-child(2)]:hidden max-sm:block max-sm:py-5 relative ${isAdmin ? 'grid-cols-[76px_100px_1fr_110px_70px_60px]' : 'grid-cols-[76px_100px_1fr_110px_70px]'}`}
          >
            <span className="text-[10px] text-[#888] max-sm:hidden">{post.id}</span>
            <span className="text-[9px] tracking-[0.06em] text-[#888] max-sm:mb-2 max-sm:block">
              {post.isPinned ? "[PIN] " : ""}{post.category}
            </span>
            <span className="text-[12px] max-sm:block max-sm:text-[13px] pr-4">{post.title}</span>
            <span className="text-[10px] text-[#888] max-sm:mt-2 max-sm:block">{formatDate(post.createdAt)}</span>
            <span className="text-[10px] text-[#888] max-sm:hidden">{post.viewCount ?? 0}</span>
            
            {/* 💡 관리자 전용 삭제 버튼 */}
            {isAdmin && (
              <button 
                onClick={(e) => handleDelete(e, post.id)}
                disabled={isDeleting}
                className="text-right text-[10px] text-red-500 hover:text-red-700 max-md:absolute max-md:right-0 max-md:top-1/2 max-md:-translate-y-1/2 max-sm:top-4 max-sm:translate-y-0"
              >
                DEL
              </button>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}