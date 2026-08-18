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

  return (
    <section className="px-7 pb-24 pt-[132px] max-sm:px-[14px] max-sm:pt-[105px]">
      <div className="text-[9px] tracking-[0.08em] text-[#999]">HOME / COMMUNITY / {post.category}</div>
      <article className="mx-auto mt-[54px] max-w-[960px] max-sm:mt-[38px]">
        <header className="border-y border-black py-7">
          <p className="text-[9px] tracking-[0.1em] text-[#888]">{post.isPinned ? "PINNED / " : ""}{post.category}</p>
          <h1 className="mt-4 text-[26px] font-normal leading-[1.35] tracking-[-0.03em] max-sm:text-[22px]">{post.title}</h1>
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-[10px] text-[#888]">
            <span>{post.author}</span>
            <span>{formatDate(post.createdAt)}</span>
            <span>VIEW {post.viewCount ?? 0}</span>
          </div>
        </header>

        <div className="min-h-[300px] whitespace-pre-wrap border-b border-black/10 px-2 py-14 text-[13px] leading-[2] text-[#333]">
          {post.content}
        </div>

        <div className="mt-8 flex justify-end">
          <Link href="/community" className="grid h-12 min-w-[140px] place-items-center border border-black text-[10px] tracking-[0.08em] text-black no-underline">
            LIST
          </Link>
        </div>
      </article>
    </section>
  );
}
