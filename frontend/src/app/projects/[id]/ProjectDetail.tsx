"use client";

import {
  BACKEND_BASE_URL,
  type PortfolioProject,
  type ProjectMedia,
} from "../../../lib/api";

function resolveAssetUrl(path?: string | null) {
  if (!path) return null;

  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("blob:") ||
    path.startsWith("data:")
  ) {
    return path;
  }

  return `${BACKEND_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

function formatPeriod(
  start?: string | null,
  end?: string | null
) {
  const format = (value?: string | null) =>
    value
      ? value.slice(0, 7).replace("-", ".")
      : "";

  const startText = format(start);

  const endText = end
    ? format(end)
    : "PRESENT";

  if (!startText && !end) {
    return "";
  }

  return `${startText} — ${endText}`;
}

function statusLabel(status: string) {
  switch (status) {
    case "PLANNING":
      return "PLANNING";

    case "IN_PROGRESS":
      return "IN PROGRESS";

    case "COMPLETED":
      return "COMPLETED";

    default:
      return status;
  }
}

export default function ProjectDetail({
  project,
  media,
}: {
  project: PortfolioProject;
  media: ProjectMedia[];
}) {
  const sortedMedia = [...media].sort(
    (a, b) =>
      (a.sortOrder ?? 0) -
      (b.sortOrder ?? 0)
  );

  const firstImage =
    sortedMedia.find(
      (item) => item.mediaType === "IMAGE"
    ) ?? null;

  const heroImage =
    resolveAssetUrl(project.thumbnail) ||
    resolveAssetUrl(firstImage?.mediaUrl);

  const period = formatPeriod(
    project.startDate,
    project.endDate
  );

  return (
    <main className="border-t border-black/10">

      {/* HERO */}
      <section className="grid min-h-[calc(100vh-74px)] grid-cols-2 max-[820px]:grid-cols-1">

        {/* LEFT MEDIA */}
        <div className="sticky top-0 h-[calc(100vh-74px)] overflow-hidden bg-[#f2f0ed] max-[820px]:static max-[820px]:h-auto">

          {heroImage ? (
            <img
              src={heroImage}
              alt={project.title}
              className="h-full w-full object-cover max-[820px]:aspect-[1/1.18] max-[820px]:h-auto"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] tracking-[0.18em] text-[#999] max-[820px]:aspect-[1/1.18]">
              PROJECT IMAGE
            </div>
          )}

        </div>

        {/* RIGHT INFO */}
        <div className="flex justify-center px-[8vw] py-[9vh] max-[1100px]:px-10 max-[820px]:px-5 max-[820px]:py-12">

          <div className="w-full max-w-[520px] self-center">

            <p className="mb-4 text-[10px] tracking-[0.18em] text-[#777]">
              PROJECT · {statusLabel(project.status)}
            </p>

            <div className="flex items-start justify-between gap-4">
              <h1 className="text-[32px] font-normal leading-[1.2] tracking-[-0.035em] max-sm:text-[26px]">
                {project.title}
              </h1>

              {project.isFeatured && (
                <span className="mt-1 border border-black px-2 py-1 text-[8px] tracking-[0.12em]">
                  FEATURED
                </span>
              )}
            </div>

            {project.subtitle && (
              <p className="mt-3 text-[13px] leading-6 text-[#777]">
                {project.subtitle}
              </p>
            )}

            {/* TECH */}
            <div className="mt-8 border-y border-black/10">

              <div className="flex justify-between gap-6 border-b border-black/10 py-4 text-[10px]">
                <span className="tracking-[0.08em] text-[#888]">
                  STATUS
                </span>

                <span>
                  {statusLabel(project.status)}
                </span>
              </div>

              {period && (
                <div className="flex justify-between gap-6 border-b border-black/10 py-4 text-[10px]">
                  <span className="tracking-[0.08em] text-[#888]">
                    PERIOD
                  </span>

                  <span>
                    {period}
                  </span>
                </div>
              )}

              {project.techStack && (
                <div className="flex justify-between gap-10 py-4 text-[10px]">
                  <span className="shrink-0 tracking-[0.08em] text-[#888]">
                    STACK
                  </span>

                  <span className="text-right leading-5">
                    {project.techStack}
                  </span>
                </div>
              )}

            </div>

            {/* DESCRIPTION */}
            {project.description && (
              <p className="mt-9 whitespace-pre-line text-[12px] leading-[1.9] text-[#555]">
                {project.description}
              </p>
            )}

            {/* LINKS */}
            {(project.githubUrl ||
              project.projectUrl) && (
              <div className="mt-9 grid grid-cols-2 gap-2.5">

                {project.githubUrl ? (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="grid h-12 place-items-center border border-black bg-white text-[10px] tracking-[0.1em] text-black no-underline transition hover:bg-[#f5f5f5]"
                  >
                    GITHUB ↗
                  </a>
                ) : (
                  <div />
                )}

                {project.projectUrl ? (
                  <a
                    href={project.projectUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="grid h-12 place-items-center bg-black text-[10px] tracking-[0.1em] text-white no-underline transition hover:bg-[#333]"
                  >
                    LIVE PROJECT ↗
                  </a>
                ) : (
                  <div />
                )}

              </div>
            )}

            <div className="mt-9 grid grid-cols-3 border-y border-black/10 py-5 text-center text-[9px] tracking-[0.07em] text-[#666]">

              <span>
                {statusLabel(project.status)}
              </span>

              <span className="border-x border-black/10">
                {media.length} MEDIA
              </span>

              <span>
                PORTFOLIO
              </span>

            </div>

          </div>
        </div>
      </section>

      {/* PROJECT STORY */}
      <section className="px-7 py-28 text-center max-sm:px-5 max-sm:py-20">

        <p className="text-[10px] tracking-[0.2em] text-[#888]">
          PROJECT OVERVIEW
        </p>

        <h2 className="mx-auto mt-5 max-w-[860px] text-[30px] font-normal leading-[1.45] tracking-[-0.025em] max-sm:text-[23px]">
          {project.subtitle ||
            project.title}
        </h2>

        {project.description && (
          <p className="mx-auto mt-6 max-w-[680px] whitespace-pre-line text-[12px] leading-[2] text-[#777]">
            {project.description}
          </p>
        )}

      </section>

      {/* PROJECT MEDIA */}
      {sortedMedia.length > 0 && (
        <section className="mx-auto max-w-[1440px] px-7 pb-28 max-sm:px-0 max-sm:pb-16">

          <div className="mb-10 text-center max-sm:px-5">
            <p className="text-[10px] tracking-[0.2em] text-[#888]">
              PROJECT DETAIL
            </p>
          </div>

          <div className="mx-auto flex max-w-[1100px] flex-col gap-16">

            {sortedMedia.map(
              (item, index) => {
                const url =
                  resolveAssetUrl(
                    item.mediaUrl
                  );

                if (!url) {
                  return null;
                }

                return (
                  <figure
                    key={item.id}
                    className="m-0"
                  >

                    {item.mediaType ===
                    "VIDEO" ? (
                      <video
                        src={url}
                        controls
                        playsInline
                        className="h-auto w-full bg-black object-contain"
                      />
                    ) : (
                      <img
                        src={url}
                        alt={
                          item.altText ||
                          `${project.title} ${
                            index + 1
                          }`
                        }
                        className="h-auto w-full object-cover"
                      />
                    )}

                    {(item.caption ||
                      item.altText) && (
                      <figcaption className="mt-4 flex items-start justify-between gap-8 border-t border-black/10 pt-4 max-sm:px-5">

                        <span className="text-[9px] tracking-[0.14em] text-[#999]">
                          {String(
                            index + 1
                          ).padStart(2, "0")}
                        </span>

                        {item.caption && (
                          <p className="max-w-[700px] flex-1 text-[11px] leading-[1.8] text-[#666]">
                            {item.caption}
                          </p>
                        )}

                      </figcaption>
                    )}

                  </figure>
                );
              }
            )}

          </div>
        </section>
      )}

    </main>
  );
}