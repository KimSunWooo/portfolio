import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownContentProps = {
  content?: string | null;
  variant?: "light" | "dark";
};

export default function MarkdownContent({
  content,
  variant = "light",
}: MarkdownContentProps) {
  if (!content?.trim()) {
    return null;
  }

  const isDark = variant === "dark";

  return (
    <div
      className={[
        "markdown-content",
        "text-[14px] max-sm:text-[13px]",
        "leading-[1.85]",
        "tracking-[-0.01em]",
        isDark ? "text-white/72" : "text-[#555]",
      ].join(" ")}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1
              className={[
                "mb-7 mt-10 first:mt-0",
                "text-[38px] max-sm:text-[28px]",
                "font-medium leading-[1.15]",
                "tracking-[-0.05em]",
                isDark ? "text-white" : "text-[#111]",
              ].join(" ")}
            >
              {children}
            </h1>
          ),

          h2: ({ children }) => (
            <h2
              className={[
                "mb-5 mt-10 first:mt-0",
                "text-[30px] max-sm:text-[24px]",
                "font-medium leading-[1.2]",
                "tracking-[-0.04em]",
                isDark ? "text-white" : "text-[#111]",
              ].join(" ")}
            >
              {children}
            </h2>
          ),

          h3: ({ children }) => (
            <h3
              className={[
                "mb-4 mt-8 first:mt-0",
                "text-[22px] max-sm:text-[19px]",
                "font-medium leading-[1.3]",
                "tracking-[-0.03em]",
                isDark ? "text-white" : "text-[#111]",
              ].join(" ")}
            >
              {children}
            </h3>
          ),

          h4: ({ children }) => (
            <h4
              className={[
                "mb-3 mt-6 first:mt-0",
                "text-[17px] max-sm:text-[15px]",
                "font-medium",
                isDark ? "text-white" : "text-[#111]",
              ].join(" ")}
            >
              {children}
            </h4>
          ),

          p: ({ children }) => (
            <p className="mb-5 last:mb-0">
              {children}
            </p>
          ),

          strong: ({ children }) => (
            <strong
              className={[
                "font-semibold",
                isDark ? "text-white" : "text-[#111]",
              ].join(" ")}
            >
              {children}
            </strong>
          ),

          em: ({ children }) => (
            <em className="italic">
              {children}
            </em>
          ),

          ul: ({ children }) => (
            <ul className="mb-6 list-disc space-y-2 pl-6">
              {children}
            </ul>
          ),

          ol: ({ children }) => (
            <ol className="mb-6 list-decimal space-y-2 pl-6">
              {children}
            </ol>
          ),

          li: ({ children }) => (
            <li className="pl-1">
              {children}
            </li>
          ),

          blockquote: ({ children }) => (
            <blockquote
              className={[
                "my-7 border-l-2 pl-5",
                "italic",
                isDark
                  ? "border-white/30 text-white/60"
                  : "border-black/20 text-[#777]",
              ].join(" ")}
            >
              {children}
            </blockquote>
          ),

          hr: () => (
            <hr
              className={
                isDark
                  ? "my-10 border-white/15"
                  : "my-10 border-black/15"
              }
            />
          ),

          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className={[
                "underline underline-offset-4",
                "transition-opacity hover:opacity-50",
                isDark ? "text-white" : "text-[#111]",
              ].join(" ")}
            >
              {children}
            </a>
          ),

          code: ({ children, className }) => {
            const isBlock = Boolean(className);

            if (isBlock) {
              return (
                <code
                  className={[
                    "block overflow-x-auto",
                    "rounded-sm px-4 py-4",
                    "font-mono text-[12px] leading-[1.7]",
                    isDark
                      ? "bg-white/8 text-white/80"
                      : "bg-[#f1f1ef] text-[#333]",
                  ].join(" ")}
                >
                  {children}
                </code>
              );
            }

            return (
              <code
                className={[
                  "rounded px-1.5 py-0.5",
                  "font-mono text-[0.9em]",
                  isDark
                    ? "bg-white/10 text-white"
                    : "bg-black/5 text-[#333]",
                ].join(" ")}
              >
                {children}
              </code>
            );
          },

          pre: ({ children }) => (
            <pre
              className={[
                "mb-7 mt-6 overflow-x-auto rounded-sm",
                isDark ? "bg-white/8" : "bg-[#f1f1ef]",
              ].join(" ")}
            >
              {children}
            </pre>
          ),

          table: ({ children }) => (
            <div className="mb-7 mt-6 overflow-x-auto">
              <table
                className={[
                  "w-full border-collapse text-left text-[12px]",
                  isDark
                    ? "text-white/75"
                    : "text-[#555]",
                ].join(" ")}
              >
                {children}
              </table>
            </div>
          ),

          thead: ({ children }) => (
            <thead
              className={
                isDark
                  ? "border-b border-white/20"
                  : "border-b border-black/20"
              }
            >
              {children}
            </thead>
          ),

          th: ({ children }) => (
            <th className="px-3 py-3 font-medium">
              {children}
            </th>
          ),

          td: ({ children }) => (
            <td
              className={[
                "border-b px-3 py-3",
                isDark
                  ? "border-white/10"
                  : "border-black/10",
              ].join(" ")}
            >
              {children}
            </td>
          ),

          del: ({ children }) => (
            <del
              className={
                isDark
                  ? "text-white/40"
                  : "text-[#999]"
              }
            >
              {children}
            </del>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}