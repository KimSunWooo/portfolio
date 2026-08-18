"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createCommunityPost,
  type CommunityCategory,
} from "../../lib/api";

export default function CommunityWriteForm() {
  const router = useRouter();
  const [category, setCategory] = useState<CommunityCategory>("NOTICE");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("ADMIN");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!title.trim() || !content.trim()) {
      setError("제목과 내용을 입력해 주세요.");
      return;
    }

    try {
      setSubmitting(true);
      const saved = await createCommunityPost({
        category,
        title: title.trim(),
        content: content.trim(),
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

  return (
    <section className="px-7 pb-24 pt-[132px] max-sm:px-[14px] max-sm:pt-[105px]">
      <div className="text-[9px] tracking-[0.08em] text-[#999]">HOME / COMMUNITY / WRITE</div>
      <div className="mx-auto mt-[54px] max-w-[960px] max-sm:mt-[38px]">
        <div className="border-b border-black pb-7">
          <h1 className="text-[34px] font-normal tracking-[-0.05em] max-sm:text-[27px]">WRITE POST</h1>
          <p className="mt-3 text-[11px] leading-5 text-[#888]">게시판에 등록할 내용을 입력해 주세요.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8">
          <div className="grid grid-cols-[140px_1fr] items-center border-b border-black/10 py-5 max-sm:grid-cols-1 max-sm:gap-3">
            <label htmlFor="category" className="text-[10px] tracking-[0.08em] text-[#777]">CATEGORY</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as CommunityCategory)}
              className="h-11 border border-black/20 bg-white px-3 text-[12px] outline-none focus:border-black"
            >
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
              placeholder="제목을 입력해 주세요."
              className="h-11 border border-black/20 px-3 text-[12px] outline-none focus:border-black"
            />
          </div>

          <div className="grid grid-cols-[140px_1fr] items-center border-b border-black/10 py-5 max-sm:grid-cols-1 max-sm:gap-3">
            <label htmlFor="author" className="text-[10px] tracking-[0.08em] text-[#777]">AUTHOR</label>
            <input
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              maxLength={50}
              className="h-11 border border-black/20 px-3 text-[12px] outline-none focus:border-black"
            />
          </div>

          <div className="grid grid-cols-[140px_1fr] items-start border-b border-black/10 py-5 max-sm:grid-cols-1 max-sm:gap-3">
            <label htmlFor="content" className="pt-3 text-[10px] tracking-[0.08em] text-[#777]">CONTENT</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력해 주세요."
              className="min-h-[360px] resize-y border border-black/20 p-4 text-[12px] leading-7 outline-none focus:border-black"
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
              상단 고정
            </label>
          </div>

          {error && <p className="mt-5 text-[11px] text-red-600">{error}</p>}

          <div className="mt-8 flex justify-end gap-2">
            <Link
              href="/community"
              className="grid h-12 min-w-[140px] place-items-center border border-black text-[10px] tracking-[0.08em] text-black no-underline"
            >
              CANCEL
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="h-12 min-w-[140px] bg-black px-6 text-[10px] tracking-[0.08em] text-white disabled:opacity-40"
            >
              {submitting ? "SUBMITTING..." : "SUBMIT"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
