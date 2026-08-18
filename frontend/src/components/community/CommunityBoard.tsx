"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  fetchCommunityPosts,
  type CommunityCategory,
  type CommunityPostListItem,
} from "../../lib/api";

const categories: ("ALL" | CommunityCategory)[] = ["ALL", "NOTICE", "FAQ", "EVENT", "QNA"];

function formatDate(value: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export default function CommunityBoard() {
  const [posts, setPosts] = useState<CommunityPostListItem[]>([]);
  const [category, setCategory] = useState<"ALL" | CommunityCategory>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    fetchCommunityPosts(category === "ALL" ? undefined : category)
      .then((data) => {
        if (!cancelled) setPosts(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [category]);

  const postCount = useMemo(() => posts.length, [posts]);

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
            <Link
              href="/community/write"
              className="border border-black px-5 py-3 text-[9px] tracking-[0.1em] text-black no-underline transition hover:bg-black hover:text-white"
            >
              WRITE
            </Link>
          </div>
        </div>
      </div>

      <div className="border-b border-[#ddd]">
        <div className="grid grid-cols-[76px_100px_1fr_110px_70px] border-b border-[#ddd] py-4 text-[9px] tracking-[0.08em] text-[#888] max-md:grid-cols-[56px_82px_1fr_92px] max-md:[&>*:last-child]:hidden max-sm:hidden">
          <span>NO.</span><span>TYPE</span><span>TITLE</span><span>DATE</span><span>VIEW</span>
        </div>

        {loading && (
          <div className="py-16 text-center text-[11px] tracking-[0.08em] text-[#999]">LOADING...</div>
        )}

        {!loading && error && (
          <div className="py-16 text-center text-[11px] text-[#999]">
            {error}<br />Spring Boot 서버가 8080 포트에서 실행 중인지 확인해 주세요.
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="py-16 text-center text-[11px] tracking-[0.08em] text-[#999]">NO POSTS</div>
        )}

        {!loading && !error && posts.map((post) => (
          <Link
            key={post.id}
            href={`/community/${post.id}`}
            className="grid grid-cols-[76px_100px_1fr_110px_70px] items-center border-b border-[#e9e9e9] py-[22px] text-[#111] no-underline transition-opacity hover:opacity-50 max-md:grid-cols-[56px_82px_1fr_92px] max-md:[&>*:last-child]:hidden max-sm:block max-sm:py-5"
          >
            <span className="text-[10px] text-[#888] max-sm:hidden">{post.id}</span>
            <span className="text-[9px] tracking-[0.06em] text-[#888] max-sm:mb-2 max-sm:block">
              {post.isPinned ? "[PIN] " : ""}{post.category}
            </span>
            <span className="text-[12px] max-sm:block max-sm:text-[13px]">{post.title}</span>
            <span className="text-[10px] text-[#888] max-sm:mt-2 max-sm:block">{formatDate(post.createdAt)}</span>
            <span className="text-[10px] text-[#888] max-sm:hidden">{post.viewCount ?? 0}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
