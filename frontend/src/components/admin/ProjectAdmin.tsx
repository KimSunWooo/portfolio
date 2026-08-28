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
    <div className="min-h-full px-8 py-8 bg-[#f9f9f9]">
      {notice && (
        <div className="fixed inset-0 z-[200] grid place-items-center bg-black/40 px-4 backdrop-blur-sm" onClick={()=>setNotice(null)}>
          <div className="w-full max-w-[420px] bg-white p-8 shadow-xl" onClick={e=>e.stopPropagation()}>
            <p className="text-[10px] font-bold tracking-[0.2em] text-[#000]">PROJECT CMS</p>
            <h2 className="mt-4 text-[20px] text-[#333]">{notice}</h2>
            <button onClick={()=>setNotice(null)} className="mt-8 w-full bg-black py-3 text-[11px] text-white">확인</button>
          </div>
        </div>
      )}

      <div className="flex items-end justify-between gap-8 border-b border-black pb-6">
        <div>
          <p className="mb-3 text-[9px] font-bold tracking-[0.2em] text-[#777]">ADMIN WORKSPACE</p>
          <h1 className="text-[clamp(36px,5vw,64px)] font-bold tracking-[-0.04em]">Project Management</h1>
          <p className="mt-3 text-xs text-[#777]">포트폴리오에 노출되는 프로젝트와 미디어를 관리합니다.</p>
        </div>
        <button
          type="button"
          onClick={() => { setEditingProject(null); setIsAdding(true); }}
          className="border border-black bg-black px-5 py-3 text-[10px] font-bold tracking-[0.14em] text-white transition hover:bg-transparent hover:text-black"
        >
          + ADD PROJECT
        </button>
      </div>

      <div className="mt-10 flex gap-8 items-start max-xl:flex-col">
        {/* 좌측: 프로젝트 목록 */}
        <div className="flex-1 w-full border-t border-black">
          <div className="grid grid-cols-[80px_1fr_120px_80px] gap-4 border-b border-black/10 py-4 text-[9px] font-bold tracking-[0.14em] text-[#777] max-lg:grid-cols-[60px_1fr_100px_60px]">
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

        {/* 우측: 프로젝트 등록/수정 폼 */}
        {isFormOpen && (
          <div className="w-full xl:w-[720px] shrink-0 xl:sticky xl:top-8 max-h-[calc(100vh-4rem)] overflow-y-auto border border-black bg-white shadow-xl custom-scrollbar">
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
    <div className={`grid grid-cols-[80px_1fr_120px_80px] items-center gap-4 border-b border-black/10 py-4 max-lg:grid-cols-[60px_1fr_100px_60px] transition-colors ${isActive ? 'bg-black/5' : ''}`}>
      <div className="h-16 w-16 overflow-hidden bg-[#f1efec] max-lg:h-12 max-lg:w-12">
        {displayThumbnail ? <img src={displayThumbnail} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-[8px] text-[#aaa]">NO IMG</div>}
      </div>
      <div>
        <p className="text-[14px] font-bold truncate">{item.title} {item.isFeatured && <span className="text-blue-500 text-[10px]">★</span>}</p>
        {item.subtitle && <p className="mt-1 text-[11px] text-[#777] truncate">{item.subtitle}</p>}
      </div>
      <div>
        <span className="inline-block bg-black px-2 py-1 text-[9px] text-white tracking-widest">{item.status}</span>
      </div>
      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={onEdit} className="text-[10px] font-bold tracking-[0.12em] text-[#777] hover:text-black">EDIT</button>
        <button type="button" onClick={onDelete} className="text-[10px] font-bold tracking-[0.12em] text-[#999] hover:text-red-600">DEL</button>
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
        
        // 💡 대기 중인 여러 개의 미디어를 순회하며 서버로 일괄 업로드
        for (const mediaItem of pendingMedia) {
          await createProjectMedia(newProject.id, {
            file: mediaItem.file,
            caption: mediaItem.caption,
            description: mediaItem.description,
            altText: "",
            sortOrder: mediaItem.sortOrder,
          });
        }
      }, "새 프로젝트와 갤러리 미디어가 성공적으로 등록되었습니다.");
      onClose();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between border-b border-black px-6 py-5 sticky top-0 bg-white z-20">
        <div>
          <p className="text-[9px] tracking-[0.16em] text-[#777]">{project ? "EDIT PROJECT" : "NEW PROJECT"}</p>
          <h3 className="mt-1 text-[18px] font-bold tracking-[-0.03em]">{project ? "Edit Project" : "Add Project"}</h3>
        </div>
        <button type="button" onClick={onClose} className="text-[9px] font-bold tracking-[0.12em] text-[#777] hover:text-black">CLOSE ✕</button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6 border-b border-black/10 flex flex-col gap-4">
          <Input label="PROJECT TITLE (필수)" value={form.title} set={(v) => field("title", v)} />
          <Input label="SUBTITLE (Overview)" value={form.subtitle ?? ""} set={(v) => field("subtitle", v)} />
          <Textarea label="PROJECT DESCRIPTION" value={form.description ?? ""} set={(v) => field("description", v)} placeholder="프로젝트 상세 설명을 입력하세요." />
        </div>

        <div className="p-6 border-b border-black/10 grid grid-cols-2 gap-4">
          <label className="col-span-2">
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

        <div className="p-6 border-b border-black/10 flex flex-col gap-4">
          <Input label="TECH STACK" value={form.techStack ?? ""} set={(v) => field("techStack", v)} placeholder="e.g. React, Next.js, Spring" />
          <Input label="THUMBNAIL URL" value={form.thumbnail ?? ""} set={(v) => field("thumbnail", v)} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="LIVE URL" value={form.projectUrl ?? ""} set={(v) => field("projectUrl", v)} />
            <Input label="GITHUB URL" value={form.githubUrl ?? ""} set={(v) => field("githubUrl", v)} />
          </div>

          <div className="mt-4 flex gap-6 items-center bg-[#f9f9f9] p-4 border border-black/10">
            <div className="flex-1">
              <Input label="SORT ORDER" type="number" value={String(form.sortOrder)} set={(v) => field("sortOrder", Number(v))} />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-[11px] font-bold text-black pt-4">
              <input type="checkbox" className="h-4 w-4 accent-black" checked={form.isFeatured} onChange={e=>field("isFeatured",e.target.checked)} /> MAIN FEATURED
            </label>
          </div>
        </div>

        <div className="p-6">
          <ProjectMediaSection 
            projectId={project?.id} 
            pendingMedia={pendingMedia} 
            setPendingMedia={setPendingMedia} 
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-black px-6 py-5 bg-[#f9f9f9] sticky bottom-0 z-20">
        <button type="button" onClick={onClose} className="border border-black/20 px-5 py-3 text-[9px] font-bold tracking-[0.14em] bg-white transition hover:border-black">CANCEL</button>
        <button type="button" onClick={handleSubmit} className="border border-black bg-black px-6 py-3 text-[9px] font-bold tracking-[0.14em] text-white transition hover:bg-white hover:text-black">
          {project ? "SAVE CHANGES" : "CREATE PROJECT"}
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 💡 미디어 업로드 및 관리 섹션 (다중 선택 대응)
// ==========================================
function ProjectMediaSection({ 
  projectId, 
  pendingMedia, 
  setPendingMedia 
}: { 
  projectId?: number; 
  pendingMedia: PendingMediaItem[]; 
  setPendingMedia: (items: PendingMediaItem[]) => void; 
}) {
  const [items, setItems] = useState<ProjectMedia[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  async function reloadMedia() {
    if (!projectId) return; 
    try { setItems(await fetchProjectMedia(projectId)); } 
    catch (error:any) { setNotice(error.message); }
  }

  useEffect(() => { reloadMedia(); }, [projectId]);

  // 💡 여러 개의 파일을 동시에 선택받아 처리하는 함수
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    if (projectId) {
      // 이미 존재하는 프로젝트일 경우: 루프 돌며 백엔드로 즉시 전송
      setNotice("서버로 미디어 파일을 업로드 중입니다...");
      try {
        let maxOrder = items.length > 0 ? Math.max(...items.map(i => i.sortOrder ?? 0)) : 0;
        
        for (let i = 0; i < selectedFiles.length; i++) {
          await createProjectMedia(projectId, {
            file: selectedFiles[i],
            caption: "",
            description: "",
            altText: "",
            sortOrder: maxOrder + i + 1,
          });
        }
        await reloadMedia();
        setNotice("선택한 미디어가 모두 등록되었습니다.");
        setTimeout(() => setNotice(null), 2000);
      } catch (error:any) { 
        setNotice(error.message); 
      }
    } else {
      // 신규 등록 중일 경우: 임시(Pending) 배열에 일괄 추가
      let maxOrder = pendingMedia.length > 0 ? Math.max(...pendingMedia.map(i => i.sortOrder ?? 0)) : 0;
      
      const newPendings: PendingMediaItem[] = selectedFiles.map((f, i) => ({
        id: Date.now().toString() + "-" + i,
        file: f,
        caption: "",
        description: "",
        sortOrder: maxOrder + i + 1,
        previewUrl: URL.createObjectURL(f)
      }));
      
      setPendingMedia([...pendingMedia, ...newPendings]);
      setNotice("임시 리스트에 추가되었습니다. 내용을 수정하고 하단의 [CREATE PROJECT]를 눌러주세요.");
      setTimeout(() => setNotice(null), 4000);
    }
    
    // 같은 파일 다시 선택 가능하도록 초기화
    e.target.value = "";
  };

  return (
    <div className="border border-black bg-[#fdfdfd]">
      <div className="bg-[#f5f5f5] px-5 py-4 border-b border-black flex justify-between items-center">
        <h4 className="text-[12px] font-bold tracking-widest text-[#333]">MEDIA GALLERY ({items.length + pendingMedia.length})</h4>
        {!projectId && <span className="bg-blue-100 px-2 py-1 text-[9px] font-bold text-blue-800 tracking-widest">PENDING MODE</span>}
      </div>

      <div className="p-5 flex flex-col gap-8">
        
        {/* 다중 파일 선택 버튼 */}
        <div className="bg-white p-6 border border-dashed border-black/40 text-center">
          <h5 className="mb-2 text-[11px] font-bold tracking-widest text-black">UPLOAD NEW MEDIA</h5>
          <p className="mb-5 text-[10px] text-gray-500">이미지나 영상을 여러 개 선택하여 한 번에 업로드할 수 있습니다.</p>
          
          <label className="inline-flex cursor-pointer items-center justify-center border border-black bg-black px-6 py-3 hover:bg-gray-800 transition">
            <span className="text-white text-[11px] font-bold tracking-widest">+ BROWSE FILES (다중 선택)</span>
            {/* 💡 multiple 속성 부여로 다중 선택 가능 */}
            <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileSelect} />
          </label>
          {notice && <p className="mt-4 text-center text-[11px] font-bold text-blue-600">{notice}</p>}
        </div>

        {/* 갤러리 리스트 (서버 아이템 + 임시 아이템) */}
        {(items.length > 0 || pendingMedia.length > 0) && (
          <div className="flex flex-col gap-6">
            {/* 1. 서버에 올라간 기존 미디어 */}
            {items.map((media) => (
              <ProjectMediaItem 
                key={media.id}
                item={media} 
                projectId={projectId!} 
                onChanged={reloadMedia} 
              />
            ))}
            
            {/* 2. 아직 서버에 안 올라간 임시 미디어 */}
            {pendingMedia.map((pItem) => (
              <PendingMediaItem 
                key={pItem.id} 
                item={pItem} 
                onUpdate={(updated) => setPendingMedia(pendingMedia.map(m => m.id === updated.id ? updated : m))}
                onRemove={() => setPendingMedia(pendingMedia.filter(m => m.id !== pItem.id))}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

// 💡 1. 서버 아이템
function ProjectMediaItem({ item, projectId, onChanged }: { item: ProjectMedia; projectId: number; onChanged: () => Promise<void>; }) {
  const [caption, setCaption] = useState(item.caption ?? "");
  const [description, setDescription] = useState(item.description ?? "");
  const [sortOrder, setSortOrder] = useState(item.sortOrder ?? 0);
  const mediaUrl = resolveAssetUrl(item.mediaUrl);

  async function save() {
    await updateProjectMedia(projectId, item.id, { caption, description, altText: item.altText, sortOrder });
    await onChanged();
  }
  async function remove() {
    if (!confirm("해당 미디어를 서버에서 삭제하시겠습니까?")) return;
    await deleteProjectMedia(projectId, item.id);
    await onChanged();
  }

  return (
    <div className="flex flex-col border border-black/20 bg-white">
      <div className="flex h-[300px] items-center justify-center bg-gray-100 p-2 relative border-b border-black/10">
        <span className="absolute top-2 left-2 bg-black px-2 py-1 text-[9px] text-white tracking-widest z-10">{item.mediaType}</span>
        {item.mediaType === "VIDEO" ? (
          <video src={mediaUrl ?? ""} controls className="h-full w-full object-contain" />
        ) : (
          <img src={mediaUrl ?? ""} alt="media" className="h-full w-full object-contain" />
        )}
      </div>
      <div className="p-5 bg-white grid gap-4">
        <div className="grid grid-cols-3 gap-4 items-end">
          <div className="col-span-2"><Input label="CAPTION" value={caption} set={setCaption} /></div>
          <div><Input label="SORT ORDER" type="number" value={String(sortOrder)} set={(v) => setSortOrder(Number(v))} /></div>
        </div>
        <MarkdownTextarea label="DESCRIPTION & CODE" value={description} set={setDescription} />
        <div className="mt-2 flex justify-end gap-2 border-t border-black/10 pt-4">
          <button type="button" onClick={remove} className="px-5 py-2.5 bg-red-50 border border-red-200 text-red-600 text-[10px] font-bold tracking-widest hover:bg-red-100 transition">DELETE</button>
          <button type="button" onClick={save} className="px-6 py-2.5 bg-black text-white text-[10px] font-bold tracking-widest hover:bg-gray-800 transition">SAVE MEDIA</button>
        </div>
      </div>
    </div>
  );
}

// 💡 2. 임시 대기열 아이템 (수정 시 실시간으로 부모 배열 업데이트)
function PendingMediaItem({ item, onUpdate, onRemove }: { item: PendingMediaItem; onUpdate: (item: PendingMediaItem) => void; onRemove: () => void; }) {
  const isVideo = item.file.type.startsWith("video/");

  return (
    <div className="flex flex-col border-2 border-blue-400 bg-blue-50/10 relative">
      <span className="absolute top-2 left-2 bg-blue-500 px-2 py-1 text-[9px] text-white tracking-widest z-10 font-bold">
        PENDING {isVideo ? "VIDEO" : "IMAGE"}
      </span>
      <div className="flex h-[300px] items-center justify-center bg-gray-50 p-2 border-b border-blue-200">
        {isVideo ? (
          <video src={item.previewUrl} controls className="h-full w-full object-contain opacity-90" />
        ) : (
          <img src={item.previewUrl} alt="pending" className="h-full w-full object-contain opacity-90" />
        )}
      </div>
      <div className="p-5 grid gap-4">
        <div className="grid grid-cols-3 gap-4 items-end">
          <div className="col-span-2">
            {/* 💡 입력하는 즉시 onUpdate를 통해 부모 상태에 저장됨 */}
            <Input label="CAPTION" value={item.caption} set={(v) => onUpdate({...item, caption: v})} />
          </div>
          <div>
            <Input label="SORT ORDER" type="number" value={String(item.sortOrder)} set={(v) => onUpdate({...item, sortOrder: Number(v)})} />
          </div>
        </div>
        <MarkdownTextarea label="DESCRIPTION & CODE" value={item.description} set={(v) => onUpdate({...item, description: v})} />
        <div className="mt-2 flex justify-between items-center border-t border-blue-200 pt-4">
          <span className="text-[10px] text-blue-500 font-bold">※ 입력한 내용이 자동 보관 중입니다.</span>
          <button type="button" onClick={onRemove} className="px-5 py-2.5 bg-white border border-red-200 text-red-500 text-[10px] font-bold tracking-widest hover:bg-red-50 transition">
            REMOVE
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 공통 입력 컴포넌트들
// ==========================================
function Input({label,value,set,type="text", placeholder=""}:{label:string;value:string;set:(v:string)=>void;type?:string, placeholder?:string}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold tracking-[0.1em] text-gray-600">{label}</span>
      <input type={type} placeholder={placeholder} className="h-11 w-full border border-black/20 px-3 text-sm outline-none transition focus:border-black" value={value} onChange={e=>set(e.target.value)} />
    </label>
  );
}

function Textarea({label,value,set,placeholder=""}:{label:string;value:string;set:(v:string)=>void;placeholder?:string}) {
  return (
    <label className="block mt-2">
      <span className="mb-1.5 block text-[10px] font-bold tracking-[0.1em] text-gray-600">{label}</span>
      <textarea className="min-h-[120px] w-full border border-black/20 p-3 text-sm outline-none transition focus:border-black resize-none" value={value} onChange={e=>set(e.target.value)} placeholder={placeholder} />
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
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    
    const codeTemplate = "\n```javascript\n// 코드를 여기에 작성하세요\n\n```\n";
    set(before + codeTemplate + after);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 14, start + 30);
    }, 0);
  };

  return (
    <div className="block mt-2">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold tracking-[0.1em] text-gray-600">{label}</span>
        <button type="button" onClick={insertCodeBlock} className="text-[9px] font-bold bg-gray-100 border border-gray-300 px-2 py-1 text-black hover:bg-gray-200 transition">
          + 코드 블록 삽입 (```)
        </button>
      </div>
      <textarea 
        ref={textareaRef}
        className="min-h-[160px] w-full border border-black/20 p-3 text-sm outline-none transition focus:border-black resize-none font-mono text-[13px] leading-relaxed bg-[#fcfcfc]" 
        value={value} 
        onChange={e=>set(e.target.value)} 
        placeholder="설명을 작성하거나 코드를 입력하세요.&#13;&#10;```javascript&#13;&#10;console.log('hello');&#13;&#10;```" 
      />
      <p className="mt-1 text-[9px] text-gray-500 text-right">※ 마크다운 문법을 지원합니다. 코드는 백틱(```)으로 감싸주세요.</p>
    </div>
  );
}