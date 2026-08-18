"use client";

import { useEffect, useState } from "react";
import {
  createProject,
  deleteProject,
  fetchProjects,
  updateProject,

  fetchProjectMedia,
  createProjectMedia,
  updateProjectMedia,
  deleteProjectMedia,

  resolveAssetUrl,

  type PortfolioProject,
  type ProjectRequest,
  type ProjectStatus,
  type ProjectMedia,
} from "../../lib/api";

const empty: ProjectRequest = {
  title: "", subtitle: "", description: "", techStack: "", projectUrl: "", githubUrl: "", thumbnail: "",
  status: "IN_PROGRESS", isFeatured: true, sortOrder: 0, startDate: null, endDate: null,
};

export default function ProjectAdmin() {
  const [items, setItems] = useState<PortfolioProject[]>([]);
  const [draft, setDraft] = useState<ProjectRequest>(empty);
  const [notice, setNotice] = useState<string | null>(null);

  async function reload() { setItems(await fetchProjects()); }
  useEffect(() => { reload().catch(e => setNotice(e.message)); }, []);
  useEffect(() => { if (!notice) return; const t=setTimeout(()=>setNotice(null),2200); return ()=>clearTimeout(t); }, [notice]);

  async function run(action: () => Promise<unknown>, msg: string) {
    try { await action(); await reload(); setNotice(msg); }
    catch (e) { setNotice(e instanceof Error ? e.message : "요청에 실패했습니다."); }
  }

  return (
    <div className="mx-auto max-w-[1440px] px-7 py-20 max-sm:px-4">
      {notice && <div className="fixed inset-0 z-[200] grid place-items-center bg-black/20 px-4" onClick={()=>setNotice(null)}>
        <div className="w-full max-w-[420px] border border-black bg-white p-7" onClick={e=>e.stopPropagation()}>
          <p className="text-[9px] tracking-[0.18em] text-[#777]">PROJECT CMS</p>
          <h2 className="mt-3 text-[22px]">처리되었습니다.</h2>
          <p className="mt-5 border-t border-black/10 pt-5 text-[12px]">{notice}</p>
        </div>
      </div>}

      <div className="mb-14 border-b border-black pb-6">
        <p className="text-[10px] tracking-[0.16em] text-[#777]">ADMIN · PROJECT CMS</p>
        <h1 className="mt-3 text-[clamp(44px,7vw,92px)] tracking-[-0.06em]">Projects</h1>
      </div>

      <ProjectForm value={draft} setValue={setDraft} button="+ ADD PROJECT" onSubmit={() => run(() => createProject(draft), "프로젝트를 등록했습니다.")} />
      <div className="mt-16 border-t border-black">
        {items.map(item => <ProjectRow key={item.id} item={item} run={run} />)}
      </div>
    </div>
  );
}

function ProjectRow({
  item,
  run,
}: {
  item: PortfolioProject;
  run: (
    a: () => Promise<unknown>,
    m: string
  ) => Promise<void>;
}) {
  const [value, setValue] =
    useState<ProjectRequest>(item);

  return (
    <div className="border-b border-black/15 py-10">
      <ProjectForm
        value={value}
        setValue={setValue}
        button="SAVE"
        onSubmit={() =>
          run(
            () => updateProject(item.id, value),
            "프로젝트를 수정했습니다."
          )
        }
        onDelete={() =>
          confirm("삭제할까요?") &&
          run(
            () => deleteProject(item.id),
            "프로젝트를 삭제했습니다."
          )
        }
      />

      <ProjectMediaSection
        projectId={item.id}
      />
    </div>
  );
}

function ProjectForm({ value, setValue, onSubmit, onDelete, button }: {
  value: ProjectRequest; setValue:(v:ProjectRequest)=>void; onSubmit:()=>void; onDelete?:()=>void; button:string
}) {
  const field=(key:keyof ProjectRequest, v:any)=>setValue({...value,[key]:v});
  return <div className="grid gap-3">
    <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
      <Input label="TITLE" value={value.title} set={v=>field("title",v)} />
      <Input label="SUBTITLE" value={value.subtitle ?? ""} set={v=>field("subtitle",v)} />
      <Input label="TECH STACK" value={value.techStack ?? ""} set={v=>field("techStack",v)} />
      <Input label="PROJECT URL" value={value.projectUrl ?? ""} set={v=>field("projectUrl",v)} />
      <Input label="GITHUB URL" value={value.githubUrl ?? ""} set={v=>field("githubUrl",v)} />
      <Input label="THUMBNAIL" value={value.thumbnail ?? ""} set={v=>field("thumbnail",v)} />
    </div>
    <label><span className="mb-2 block text-[9px] tracking-[0.14em] text-[#777]">DESCRIPTION</span>
      <textarea className="min-h-[120px] w-full border border-black/20 p-3 text-[12px]" value={value.description ?? ""} onChange={e=>field("description",e.target.value)} />
    </label>
    <div className="grid grid-cols-4 gap-3 max-md:grid-cols-2">
      <label><span className="mb-2 block text-[9px]">STATUS</span>
        <select className="h-11 w-full border border-black/20 px-3 text-[12px]" value={value.status} onChange={e=>field("status",e.target.value as ProjectStatus)}>
          <option value="PLANNING">PLANNING</option><option value="IN_PROGRESS">IN_PROGRESS</option><option value="COMPLETED">COMPLETED</option>
        </select>
      </label>
      <Input label="ORDER" type="number" value={String(value.sortOrder)} set={v=>field("sortOrder",Number(v))} />
      <Input label="START" type="date" value={value.startDate ?? ""} set={v=>field("startDate",v || null)} />
      <Input label="END" type="date" value={value.endDate ?? ""} set={v=>field("endDate",v || null)} />
    </div>
    <label className="flex items-center gap-2 text-[11px]"><input type="checkbox" checked={value.isFeatured} onChange={e=>field("isFeatured",e.target.checked)} /> 메인 Selected Work에 표시</label>
    <div className="flex justify-end gap-2">
      {onDelete && <button type="button" className="h-10 border border-red-300 px-4 text-[9px] text-red-600" onClick={onDelete}>DELETE</button>}
      <button type="button" className="h-10 border border-black bg-black px-5 text-[9px] text-white" onClick={onSubmit}>{button}</button>
    </div>
  </div>;
}

function ProjectMediaSection({
  projectId,
}: {
  projectId: number;
}) {
  const [items, setItems] =
    useState<ProjectMedia[]>([]);

  const [file, setFile] =
    useState<File | null>(null);

  const [caption, setCaption] =
    useState("");

  const [altText, setAltText] =
    useState("");

  const [sortOrder, setSortOrder] =
    useState(0);

  const [preview, setPreview] =
    useState<string | null>(null);

  const [notice, setNotice] =
    useState<string | null>(null);

  async function reloadMedia() {
    try {
      const next =
        await fetchProjectMedia(projectId);

      setItems(next);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "미디어를 불러오지 못했습니다."
      );
    }
  }

  useEffect(() => {
    reloadMedia();
  }, [projectId]);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }

    const url =
      URL.createObjectURL(file);

    setPreview(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  async function upload() {
    if (!file) {
      setNotice("업로드할 파일을 선택해주세요.");
      return;
    }

    try {
      await createProjectMedia(
        projectId,
        {
          file,
          caption,
          altText,
          sortOrder,
        }
      );

      setFile(null);
      setCaption("");
      setAltText("");
      setSortOrder(0);

      await reloadMedia();

      setNotice(
        "프로젝트 미디어를 등록했습니다."
      );

    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "미디어 등록에 실패했습니다."
      );
    }
  }

  return (
    <div className="mt-10 border-t border-black/15 pt-8">

      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-[9px] tracking-[0.16em] text-[#777]">
            PROJECT MEDIA
          </p>

          <h3 className="mt-2 text-[24px] tracking-[-0.04em]">
            Images & Videos
          </h3>
        </div>

        <span className="text-[9px] tracking-[0.12em] text-[#999]">
          {items.length} ITEMS
        </span>
      </div>

      {items.length > 0 && (
        <div className="mb-8 grid grid-cols-2 gap-4 max-md:grid-cols-1">
          {items.map((media) => (
            <ProjectMediaItem
              key={media.id}
              item={media}
              projectId={projectId}
              onChanged={reloadMedia}
            />
          ))}
        </div>
      )}

      <div className="border border-black/15 bg-[#f7f6f4] p-5">

        <p className="mb-4 text-[9px] tracking-[0.16em] text-[#777]">
          ADD MEDIA
        </p>

        {preview && (
          <div className="mb-5 overflow-hidden border border-black/10 bg-white">

            {file?.type.startsWith("video/") ? (
              <video
                src={preview}
                controls
                className="max-h-[420px] w-full object-contain"
              />
            ) : (
              <img
                src={preview}
                alt="New project media preview"
                className="max-h-[420px] w-full object-contain"
              />
            )}

          </div>
        )}

        <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">

          <label>
            <span className="mb-2 block text-[9px] tracking-[0.14em] text-[#777]">
              FILE
            </span>

            <label className="flex h-11 cursor-pointer items-center justify-between border border-black/20 bg-white px-3">
              <span className="truncate text-[10px] text-[#555]">
                {file
                  ? file.name
                  : "SELECT IMAGE OR VIDEO"}
              </span>

              <span className="text-[8px] tracking-[0.12em] text-[#777]">
                BROWSE ↗
              </span>

              <input
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => {
                  const selected =
                    e.target.files?.[0] ?? null;

                  setFile(selected);

                  e.target.value = "";
                }}
              />
            </label>
          </label>

          <Input
            label="ORDER"
            type="number"
            value={String(sortOrder)}
            set={(v) =>
              setSortOrder(Number(v))
            }
          />

          <Input
            label="ALT TEXT"
            value={altText}
            set={setAltText}
          />

          <Input
            label="CAPTION"
            value={caption}
            set={setCaption}
          />

        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={upload}
            className="h-10 border border-black bg-black px-5 text-[9px] tracking-[0.12em] text-white"
          >
            + ADD MEDIA
          </button>
        </div>
      </div>

      {notice && (
        <p className="mt-3 text-[10px] text-[#666]">
          {notice}
        </p>
      )}

    </div>
  );
}

function ProjectMediaItem({
  item,
  projectId,
  onChanged,
}: {
  item: ProjectMedia;
  projectId: number;
  onChanged: () => Promise<void>;
}) {
  const [caption, setCaption] =
    useState(item.caption ?? "");

  const [altText, setAltText] =
    useState(item.altText ?? "");

  const [sortOrder, setSortOrder] =
    useState(item.sortOrder ?? 0);

  const mediaUrl =
    resolveAssetUrl(item.mediaUrl);

  async function save() {
    await updateProjectMedia(
      projectId,
      item.id,
      {
        caption,
        altText,
        sortOrder,
      }
    );

    await onChanged();
  }

  async function remove() {
    if (!confirm("이 미디어를 삭제할까요?")) {
      return;
    }

    await deleteProjectMedia(
      projectId,
      item.id
    );

    await onChanged();
  }

  return (
    <div className="border border-black/15 bg-white">

      <div className="flex min-h-[260px] items-center justify-center overflow-hidden bg-[#f3f2ef]">

        {item.mediaType === "VIDEO" ? (
          <video
            src={mediaUrl ?? ""}
            controls
            className="max-h-[420px] w-full object-contain"
          />
        ) : (
          <img
            src={mediaUrl ?? ""}
            alt={altText || "Project media"}
            className="max-h-[420px] w-full object-contain"
          />
        )}

      </div>

      <div className="p-4">

        <div className="mb-4 flex items-center justify-between">
          <span className="text-[9px] tracking-[0.14em] text-[#777]">
            {item.mediaType}
          </span>

          <span className="text-[9px] text-[#aaa]">
            #{item.id}
          </span>
        </div>

        <div className="grid gap-3">

          <Input
            label="CAPTION"
            value={caption}
            set={setCaption}
          />

          <Input
            label="ALT TEXT"
            value={altText}
            set={setAltText}
          />

          <Input
            label="ORDER"
            type="number"
            value={String(sortOrder)}
            set={(v) =>
              setSortOrder(Number(v))
            }
          />

        </div>

        <div className="mt-4 flex justify-end gap-2">

          <button
            type="button"
            onClick={remove}
            className="h-9 border border-red-300 px-4 text-[9px] text-red-600"
          >
            DELETE
          </button>

          <button
            type="button"
            onClick={save}
            className="h-9 border border-black px-4 text-[9px] transition hover:bg-black hover:text-white"
          >
            SAVE MEDIA
          </button>

        </div>

      </div>
    </div>
  );
}

function Input({label,value,set,type="text"}:{label:string;value:string;set:(v:string)=>void;type?:string}) {
  return <label><span className="mb-2 block text-[9px] tracking-[0.14em] text-[#777]">{label}</span>
    <input type={type} className="h-11 w-full border border-black/20 px-3 text-[12px]" value={value} onChange={e=>set(e.target.value)} />
  </label>;
}
