"use client";

import { useEffect, useState, useRef } from "react";
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

const emptyRequest: ProjectRequest = {
  title: "", subtitle: "", description: "", techStack: "", projectUrl: "", githubUrl: "", thumbnail: "",
  status: "IN_PROGRESS", isFeatured: true, sortOrder: 0, startDate: null, endDate: null,
};

type PendingMediaItem = {
  id: string; 
  file: File;
  caption: string;
  description: string;
  sortOrder: number;
  previewUrl: string;
};

export default function ProjectAdmin() {
  const [items, setItems] = useState<PortfolioProject[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null);

  async function reload() { setItems(await fetchProjects()); }
  
  useEffect(() => { reload().catch(e => setNotice(e.message)); }, []);
  useEffect(() => { 
    if (!notice) return; 
    const t = setTimeout(() => setNotice(null), 2200); 
    return () => clearTimeout(t); 
  }, [notice]);

  async function run(action: () => Promise<unknown>, msg: string) {
    try { await action(); await reload(); setNotice(msg); } 
    catch (e) { setNotice(e instanceof Error ? e.message : "요청에 실패했습니다."); }
  }

  const isFormOpen = isAdding || editingProject !== null;

  return (
    <div className="min-h-full bg-[#f9f9f9] px-4 py-6 md:px-8 md:py-8">
      {notice && (
        <div className="fixed inset-0 z-[200] grid place-items-center bg-black/40 px-4 backdrop-blur-sm" onClick={()=>setNotice(null)}>
          <div className="w-full max-w-[420px] bg-white p-6 md:p-8 shadow-xl" onClick={e=>e.stopPropagation()}>
            <p className="text-[10px] font-bold tracking-[0.2em] text-[#000]">PROJECT CMS</p>
            <h2 className="mt-4 text-[18px] md:text-[20px] text-[#333]">{notice}</h2>
            <button onClick={()=>setNotice(null)} className="mt-8 w-full bg-black py-3 text-[11px] text-white">확인</button>
          </div>
        </div>
      )}

      <div className="flex flex-col items-start gap-4 border-b border-black pb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
        <div>
          <p className="mb-2 text-[9px] font-bold tracking-[0.2em] text-[#777] md:mb-3">ADMIN WORKSPACE</p>
          <h1 className="text-[clamp(30px,5vw,64px)] font-bold tracking-[-0.04em]">Project Management</h1>
          <p className="mt-2 text-xs text-[#777] md:mt-3">포트폴리오에 노출되는 프로젝트와 미디어를 관리합니다.</p>
        </div>
        <button
          type="button"
          onClick={() => { setEditingProject(null); setIsAdding(true); }}
          className="w-full border border-black bg-black px-5 py-3 text-[10px] font-bold tracking-[0.14em] text-white transition hover:bg-transparent hover:text-black sm:w-auto"
        >
          + ADD PROJECT
        </button>
      </div>

      <div className="mt-8 flex flex-col items-start gap-8 md:mt-10 xl:flex-row">
        {/* 좌측: 프로젝트 목록 (모바일 가로 스크롤) */}
        <div className="w-full flex-1 border-t border-black overflow-x-auto custom-scrollbar">
          <div className="min-w-[500px]">
            <div className="grid grid-cols-[60px_1fr_100px_60px] gap-4 border-b border-black/10 py-4 text-[9px] font-bold tracking-[0.14em] text-[#777] md:grid-cols-[80px_1fr_120px_80px]">
              <span>THUMBNAIL</span>
              <span>PROJECT</span>
              <span>STATUS</span>
              <span className="text-right">ACTIONS</span>
            </div>
            {items.length === 0 && <div className="py-16 text-center text-[11px] tracking-[0.08em] text-[#999]">등록된 프로젝트가 없습니다.</div>}
            
            {items.map((item) => (
              <ProjectListItem 
                key={item.id}
                item={item} 
                isActive={editingProject?.id === item.id}
                onEdit={() => { setIsAdding(false); setEditingProject(item); }}
                onDelete={async () => {
                  if (confirm(`"${item.title}" 프로젝트를 삭제하시겠습니까?`)) {
                    await run(() => deleteProject(item.id), "프로젝트를 삭제했습니다.");
                    if (editingProject?.id === item.id) { setEditingProject(null); setIsAdding(false); }
                  }
                }}
              />
            ))}
          </div>
        </div>

        {/* 우측: 프로젝트 등록/수정 폼 */}
        {isFormOpen && (
          <div className="w-full shrink-0 border border-black bg-white shadow-xl custom-scrollbar xl:sticky xl:top-8 xl:max-h-[calc(100vh-4rem)] xl:w-[720px] xl:overflow-y-auto">
            <RightSidePanel 
              key={editingProject?.id ?? "new"}
              project={editingProject} 
              run={run} 
              onClose={() => { setIsAdding(false); setEditingProject(null); }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectListItem({ item, isActive, onEdit, onDelete }: { item: PortfolioProject; isActive: boolean; onEdit: () => void; onDelete: () => void; }) {
  const [firstMediaUrl, setFirstMediaUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!item.thumbnail) {
      fetchProjectMedia(item.id).then((media) => {
        if (media.length > 0) {
          const sorted = [...media].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
          const firstImg = sorted.find((m) => m.mediaType === "IMAGE") || sorted[0];
          if (firstImg) setFirstMediaUrl(firstImg.mediaUrl);
        }
      }).catch(() => {});
    }
  }, [item.id, item.thumbnail]);

  const displayThumbnail = item.thumbnail ? resolveAssetUrl(item.thumbnail) : firstMediaUrl ? resolveAssetUrl(firstMediaUrl) : null;

  return (
    <div className={`grid grid-cols-[60px_1fr_100px_60px] md:grid-cols-[80px_1fr_120px_80px] items-center gap-4 border-b border-black/10 py-4 transition-colors ${isActive ? 'bg-black/5' : ''}`}>
      <div className="h-12 w-12 overflow-hidden bg-[#f1efec] md:h-16 md:w-16">
        {displayThumbnail ? <img src={displayThumbnail} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-[8px] text-[#aaa]">NO IMG</div>}
      </div>
      <div>
        <p className="truncate text-[13px] font-bold md:text-[14px]">{item.title} {item.isFeatured && <span className="text-blue-500 text-[10px]">★</span>}</p>
        {item.subtitle && <p className="mt-1 truncate text-[10px] text-[#777] md:text-[11px]">{item.subtitle}</p>}
      </div>
      <div>
        <span className="inline-block bg-black px-2 py-1 text-[8px] tracking-widest text-white md:text-[9px]">{item.status}</span>
      </div>
      <div className="flex items-center justify-end gap-2 md:gap-3">
        <button type="button" onClick={onEdit} className="text-[9px] font-bold tracking-[0.12em] text-[#777] hover:text-black md:text-[10px]">EDIT</button>
        <button type="button" onClick={onDelete} className="text-[9px] font-bold tracking-[0.12em] text-[#999] hover:text-red-600 md:text-[10px]">DEL</button>
      </div>
    </div>
  );
}

function RightSidePanel({ project, run, onClose }: { project: PortfolioProject | null; run: (a: () => Promise<unknown>, m: string) => Promise<void>; onClose: () => void; }) {
  const [form, setForm] = useState<ProjectRequest>(project ? { ...project } : emptyRequest);
  const [pendingMedia, setPendingMedia] = useState<PendingMediaItem[]>([]);

  const field = (key: keyof ProjectRequest, v: any) => setForm({ ...form, [key]: v });

  const handleSubmit = async () => {
    if (!form.title || form.title.trim() === "") return alert("프로젝트 제목을 입력해주세요.");
    if (!form.status) return alert("프로젝트 상태를 선택해주세요.");

    if (project) {
      await run(() => updateProject(project.id, form), "프로젝트 정보가 수정되었습니다.");
    } else {
      await run(async () => {
        const newProject = await createProject(form);
        for (const mediaItem of pendingMedia) {
          await createProjectMedia(newProject.id, {
            file: mediaItem.file, caption: mediaItem.caption, description: mediaItem.description, altText: "", sortOrder: mediaItem.sortOrder,
          });
        }
      }, "새 프로젝트와 갤러리 미디어가 성공적으로 등록되었습니다.");
      onClose();
    }
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-black bg-white px-4 py-4 md:px-6 md:py-5">
        <div>
          <p className="text-[9px] tracking-[0.16em] text-[#777]">{project ? "EDIT PROJECT" : "NEW PROJECT"}</p>
          <h3 className="mt-1 text-[16px] font-bold tracking-[-0.03em] md:text-[18px]">{project ? "Edit Project" : "Add Project"}</h3>
        </div>
        <button type="button" onClick={onClose} className="text-[9px] font-bold tracking-[0.12em] text-[#777] hover:text-black">CLOSE ✕</button>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 border-b border-black/10 p-4 md:p-6">
          <Input label="PROJECT TITLE (필수)" value={form.title} set={(v) => field("title", v)} />
          <Input label="SUBTITLE (Overview)" value={form.subtitle ?? ""} set={(v) => field("subtitle", v)} />
          <Textarea label="PROJECT DESCRIPTION" value={form.description ?? ""} set={(v) => field("description", v)} placeholder="프로젝트 상세 설명을 입력하세요." />
        </div>

        <div className="grid grid-cols-1 gap-4 border-b border-black/10 p-4 sm:grid-cols-2 md:p-6">
          <label className="sm:col-span-2">
            <span className="mb-2 block text-[10px] font-bold tracking-[0.1em] text-gray-600">STATUS (필수)</span>
            <select className="h-11 w-full border border-black/20 bg-white px-3 text-sm outline-none focus:border-black" value={form.status} onChange={e=>field("status",e.target.value as ProjectStatus)}>
              <option value="PLANNING">PLANNING (기획 중)</option>
              <option value="IN_PROGRESS">IN PROGRESS (진행 중)</option>
              <option value="COMPLETED">COMPLETED (완료)</option>
            </select>
          </label>
          <Input label="START DATE" type="date" value={form.startDate ?? ""} set={(v) => field("startDate", v || null)} />
          <Input label="END DATE" type="date" value={form.endDate ?? ""} set={(v) => field("endDate", v || null)} />
        </div>

        <div className="flex flex-col gap-4 border-b border-black/10 p-4 md:p-6">
          <Input label="TECH STACK" value={form.techStack ?? ""} set={(v) => field("techStack", v)} placeholder="e.g. React, Next.js, Spring" />
          <Input label="THUMBNAIL URL" value={form.thumbnail ?? ""} set={(v) => field("thumbnail", v)} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="LIVE URL" value={form.projectUrl ?? ""} set={(v) => field("projectUrl", v)} />
            <Input label="GITHUB URL" value={form.githubUrl ?? ""} set={(v) => field("githubUrl", v)} />
          </div>

          <div className="mt-2 flex flex-col items-start gap-4 border border-black/10 bg-[#f9f9f9] p-4 sm:flex-row sm:items-center sm:gap-6 md:mt-4">
            <div className="w-full sm:flex-1">
              <Input label="SORT ORDER" type="number" value={String(form.sortOrder)} set={(v) => field("sortOrder", Number(v))} />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-[11px] font-bold text-black sm:pt-4">
              <input type="checkbox" className="h-4 w-4 accent-black" checked={form.isFeatured} onChange={e=>field("isFeatured",e.target.checked)} /> MAIN FEATURED
            </label>
          </div>
        </div>

        <div className="p-4 md:p-6">
          <ProjectMediaSection 
            projectId={project?.id} 
            pendingMedia={pendingMedia} 
            setPendingMedia={setPendingMedia} 
          />
        </div>
      </div>

      <div className="sticky bottom-0 z-20 flex justify-end gap-3 border-t border-black bg-[#f9f9f9] px-4 py-4 md:px-6 md:py-5">
        <button type="button" onClick={onClose} className="border border-black/20 bg-white px-4 py-3 text-[9px] font-bold tracking-[0.14em] transition hover:border-black md:px-5">CANCEL</button>
        <button type="button" onClick={handleSubmit} className="border border-black bg-black px-4 py-3 text-[9px] font-bold tracking-[0.14em] text-white transition hover:bg-white hover:text-black md:px-6">
          {project ? "SAVE CHANGES" : "CREATE PROJECT"}
        </button>
      </div>
    </div>
  );
}

function ProjectMediaSection({ projectId, pendingMedia, setPendingMedia }: { projectId?: number; pendingMedia: PendingMediaItem[]; setPendingMedia: (items: PendingMediaItem[]) => void; }) {
  const [items, setItems] = useState<ProjectMedia[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  async function reloadMedia() {
    if (!projectId) return; 
    try { setItems(await fetchProjectMedia(projectId)); } 
    catch (error:any) { setNotice(error.message); }
  }

  useEffect(() => { reloadMedia(); }, [projectId]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    if (projectId) {
      setNotice("서버로 미디어 파일을 업로드 중입니다...");
      try {
        let maxOrder = items.length > 0 ? Math.max(...items.map(i => i.sortOrder ?? 0)) : 0;
        for (let i = 0; i < selectedFiles.length; i++) {
          await createProjectMedia(projectId, { file: selectedFiles[i], caption: "", description: "", altText: "", sortOrder: maxOrder + i + 1 });
        }
        await reloadMedia();
        setNotice("선택한 미디어가 모두 등록되었습니다.");
        setTimeout(() => setNotice(null), 2000);
      } catch (error:any) { setNotice(error.message); }
    } else {
      let maxOrder = pendingMedia.length > 0 ? Math.max(...pendingMedia.map(i => i.sortOrder ?? 0)) : 0;
      const newPendings: PendingMediaItem[] = selectedFiles.map((f, i) => ({
        id: Date.now().toString() + "-" + i, file: f, caption: "", description: "", sortOrder: maxOrder + i + 1, previewUrl: URL.createObjectURL(f)
      }));
      setPendingMedia([...pendingMedia, ...newPendings]);
      setNotice("임시 리스트에 추가되었습니다. 하단의 [CREATE PROJECT]를 눌러주세요.");
      setTimeout(() => setNotice(null), 4000);
    }
    e.target.value = "";
  };

  return (
    <div className="border border-black bg-[#fdfdfd]">
      <div className="flex items-center justify-between border-b border-black bg-[#f5f5f5] px-4 py-4 md:px-5">
        <h4 className="text-[11px] font-bold tracking-widest text-[#333] md:text-[12px]">MEDIA GALLERY ({items.length + pendingMedia.length})</h4>
        {!projectId && <span className="bg-blue-100 px-2 py-1 text-[8px] font-bold tracking-widest text-blue-800 md:text-[9px]">PENDING MODE</span>}
      </div>

      <div className="flex flex-col gap-6 p-4 md:gap-8 md:p-5">
        <div className="border border-dashed border-black/40 bg-white p-6 text-center">
          <h5 className="mb-2 text-[11px] font-bold tracking-widest text-black">UPLOAD NEW MEDIA</h5>
          <p className="mb-5 text-[9px] text-gray-500 md:text-[10px]">이미지나 영상을 여러 개 선택하여 한 번에 업로드할 수 있습니다.</p>
          <label className="inline-flex cursor-pointer items-center justify-center border border-black bg-black px-4 py-3 transition hover:bg-gray-800 md:px-6">
            <span className="text-[10px] font-bold tracking-widest text-white md:text-[11px]">+ BROWSE FILES</span>
            <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileSelect} />
          </label>
          {notice && <p className="mt-4 text-center text-[10px] font-bold text-blue-600 md:text-[11px]">{notice}</p>}
        </div>

        {(items.length > 0 || pendingMedia.length > 0) && (
          <div className="flex flex-col gap-6">
            {items.map((media) => <ProjectMediaItem key={media.id} item={media} projectId={projectId!} onChanged={reloadMedia} />)}
            {pendingMedia.map((pItem) => <PendingMediaItem key={pItem.id} item={pItem} onUpdate={(updated) => setPendingMedia(pendingMedia.map(m => m.id === updated.id ? updated : m))} onRemove={() => setPendingMedia(pendingMedia.filter(m => m.id !== pItem.id))} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectMediaItem({ item, projectId, onChanged }: { item: ProjectMedia; projectId: number; onChanged: () => Promise<void>; }) {
  const [caption, setCaption] = useState(item.caption ?? "");
  const [description, setDescription] = useState(item.description ?? "");
  const [sortOrder, setSortOrder] = useState(item.sortOrder ?? 0);
  const mediaUrl = resolveAssetUrl(item.mediaUrl);

  async function save() { await updateProjectMedia(projectId, item.id, { caption, description, altText: item.altText, sortOrder }); await onChanged(); }
  async function remove() { if (!confirm("해당 미디어를 서버에서 삭제하시겠습니까?")) return; await deleteProjectMedia(projectId, item.id); await onChanged(); }

  return (
    <div className="flex flex-col border border-black/20 bg-white">
      <div className="relative flex h-[200px] items-center justify-center border-b border-black/10 bg-gray-100 p-2 md:h-[300px]">
        <span className="absolute left-2 top-2 z-10 bg-black px-2 py-1 text-[8px] tracking-widest text-white md:text-[9px]">{item.mediaType}</span>
        {item.mediaType === "VIDEO" ? <video src={mediaUrl ?? ""} controls className="h-full w-full object-contain" /> : <img src={mediaUrl ?? ""} alt="media" className="h-full w-full object-contain" />}
      </div>
      <div className="grid gap-4 bg-white p-4 md:p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
          <div className="sm:col-span-2"><Input label="CAPTION" value={caption} set={setCaption} /></div>
          <div><Input label="SORT ORDER" type="number" value={String(sortOrder)} set={(v) => setSortOrder(Number(v))} /></div>
        </div>
        <MarkdownTextarea label="DESCRIPTION & CODE" value={description} set={setDescription} />
        <div className="mt-2 flex justify-end gap-2 border-t border-black/10 pt-4">
          <button type="button" onClick={remove} className="border border-red-200 bg-red-50 px-4 py-2.5 text-[9px] font-bold tracking-widest text-red-600 transition hover:bg-red-100 md:text-[10px]">DELETE</button>
          <button type="button" onClick={save} className="bg-black px-4 py-2.5 text-[9px] font-bold tracking-widest text-white transition hover:bg-gray-800 md:text-[10px]">SAVE MEDIA</button>
        </div>
      </div>
    </div>
  );
}

function PendingMediaItem({ item, onUpdate, onRemove }: { item: PendingMediaItem; onUpdate: (item: PendingMediaItem) => void; onRemove: () => void; }) {
  const isVideo = item.file.type.startsWith("video/");
  return (
    <div className="relative flex flex-col border-2 border-blue-400 bg-blue-50/10">
      <span className="absolute left-2 top-2 z-10 bg-blue-500 px-2 py-1 text-[8px] font-bold tracking-widest text-white md:text-[9px]">
        PENDING {isVideo ? "VIDEO" : "IMAGE"}
      </span>
      <div className="flex h-[200px] items-center justify-center border-b border-blue-200 bg-gray-50 p-2 md:h-[300px]">
        {isVideo ? <video src={item.previewUrl} controls className="h-full w-full object-contain opacity-90" /> : <img src={item.previewUrl} alt="pending" className="h-full w-full object-contain opacity-90" />}
      </div>
      <div className="grid gap-4 p-4 md:p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
          <div className="sm:col-span-2"><Input label="CAPTION" value={item.caption} set={(v) => onUpdate({...item, caption: v})} /></div>
          <div><Input label="SORT ORDER" type="number" value={String(item.sortOrder)} set={(v) => onUpdate({...item, sortOrder: Number(v)})} /></div>
        </div>
        <MarkdownTextarea label="DESCRIPTION & CODE" value={item.description} set={(v) => onUpdate({...item, description: v})} />
        <div className="mt-2 flex flex-col items-start justify-between gap-2 border-t border-blue-200 pt-4 sm:flex-row sm:items-center sm:gap-0">
          <span className="text-[9px] font-bold text-blue-500 md:text-[10px]">※ 입력한 내용이 자동 보관 중입니다.</span>
          <button type="button" onClick={onRemove} className="border border-red-200 bg-white px-4 py-2.5 text-[9px] font-bold tracking-widest text-red-500 transition hover:bg-red-50 md:text-[10px]">REMOVE</button>
        </div>
      </div>
    </div>
  );
}

function Input({label,value,set,type="text", placeholder=""}:{label:string;value:string;set:(v:string)=>void;type?:string, placeholder?:string}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[9px] font-bold tracking-[0.1em] text-gray-600 md:text-[10px]">{label}</span>
      <input type={type} placeholder={placeholder} className="h-11 w-full border border-black/20 px-3 text-sm outline-none transition focus:border-black" value={value} onChange={e=>set(e.target.value)} />
    </label>
  );
}

function Textarea({label,value,set,placeholder=""}:{label:string;value:string;set:(v:string)=>void;placeholder?:string}) {
  return (
    <label className="mt-2 block">
      <span className="mb-1.5 block text-[9px] font-bold tracking-[0.1em] text-gray-600 md:text-[10px]">{label}</span>
      <textarea className="min-h-[120px] w-full resize-none border border-black/20 p-3 text-sm outline-none transition focus:border-black" value={value} onChange={e=>set(e.target.value)} placeholder={placeholder} />
    </label>
  );
}

function MarkdownTextarea({label, value, set}: {label: string, value: string, set: (v: string) => void}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const insertCodeBlock = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    set(text.substring(0, start) + "\n```javascript\n// 코드를 여기에 작성하세요\n\n```\n" + text.substring(end, text.length));
    setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + 14, start + 30); }, 0);
  };
  return (
    <div className="mt-2 block">
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[9px] font-bold tracking-[0.1em] text-gray-600 md:text-[10px]">{label}</span>
        <button type="button" onClick={insertCodeBlock} className="border border-gray-300 bg-gray-100 px-2 py-1 text-[8px] font-bold text-black transition hover:bg-gray-200 md:text-[9px]">+ 코드 블록 삽입</button>
      </div>
      <textarea ref={textareaRef} className="min-h-[160px] w-full resize-none border border-black/20 bg-[#fcfcfc] p-3 font-mono text-[12px] leading-relaxed outline-none transition focus:border-black md:text-[13px]" value={value} onChange={e=>set(e.target.value)} placeholder="설명을 작성하거나 코드를 입력하세요.&#13;&#10;```javascript&#13;&#10;console.log('hello');&#13;&#10;```" />
      <p className="mt-1 text-right text-[8px] text-gray-500 md:text-[9px]">※ 마크다운 문법을 지원합니다.</p>
    </div>
  );
}