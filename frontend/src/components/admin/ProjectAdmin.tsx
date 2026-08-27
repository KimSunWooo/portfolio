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
} from "../../lib/api"; // 경로를 실제 환경에 맞게 수정하세요

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
    <div className="mx-auto max-w-[1200px] bg-[#f9f9f9] px-7 py-16 max-sm:px-4 min-h-screen">
      {notice && (
        <div className="fixed inset-0 z-[200] grid place-items-center bg-black/40 px-4 backdrop-blur-sm" onClick={()=>setNotice(null)}>
          <div className="w-full max-w-[420px] bg-white p-8 shadow-xl" onClick={e=>e.stopPropagation()}>
            <p className="text-[10px] font-bold tracking-[0.2em] text-[#000]">PROJECT CMS</p>
            <h2 className="mt-4 text-[20px] text-[#333]">{notice}</h2>
            <button onClick={()=>setNotice(null)} className="mt-8 w-full bg-black py-3 text-[11px] text-white">확인</button>
          </div>
        </div>
      )}

      <div className="mb-12 border-b border-black/10 pb-6">
        <p className="text-[11px] font-bold tracking-[0.2em] text-[#555]">ADMIN WORKSPACE</p>
        <h1 className="mt-2 text-[32px] font-bold tracking-[-0.04em]">Project Management</h1>
      </div>

      {/* 새 프로젝트 등록 폼 */}
      <div className="mb-16">
        <h2 className="mb-4 text-[16px] font-bold">Add New Project</h2>
        <ProjectForm 
          value={draft} 
          setValue={setDraft} 
          button="+ CREATE PROJECT" 
          onSubmit={() => run(() => createProject(draft), "프로젝트를 등록했습니다.")} 
        />
      </div>

      {/* 등록된 프로젝트 목록 */}
      <div>
        <h2 className="mb-6 text-[18px] font-bold">Registered Projects ({items.length})</h2>
        <div className="flex flex-col gap-8">
          {items.map(item => <ProjectRow key={item.id} item={item} run={run} />)}
        </div>
      </div>
    </div>
  );
}

function ProjectRow({
  item,
  run,
}: {
  item: PortfolioProject;
  run: (a: () => Promise<unknown>, m: string) => Promise<void>;
}) {
  const [value, setValue] = useState<ProjectRequest>(item);
  const [isOpen, setIsOpen] = useState(false); 
  
  // 💡 썸네일이 없을 때 사용할 첫 번째 미디어 URL 상태
  const [firstMediaUrl, setFirstMediaUrl] = useState<string | null>(null);

  // 💡 썸네일 데이터가 없다면, API를 찔러서 이 프로젝트의 미디어 목록을 가져옵니다.
  useEffect(() => {
    if (!item.thumbnail) {
      fetchProjectMedia(item.id)
        .then((media) => {
          if (media.length > 0) {
            // sortOrder 기준으로 정렬한 뒤, 가장 첫 번째 이미지(또는 비디오) 추출
            const sortedMedia = [...media].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
            const firstImg = sortedMedia.find((m) => m.mediaType === "IMAGE") || sortedMedia[0];
            
            if (firstImg) {
              setFirstMediaUrl(firstImg.mediaUrl);
            }
          }
        })
        .catch(() => {
          // 에러 무시 (미디어가 없거나 실패한 경우 NO IMG 유지)
        });
    }
  }, [item.id, item.thumbnail]);

  // 💡 최종 썸네일 URL 결정 
  // (1순위: 직접 입력한 썸네일 URL -> 2순위: 업로드된 첫 번째 미디어 -> 3순위: null)
  const displayThumbnail = item.thumbnail 
    ? resolveAssetUrl(item.thumbnail) 
    : firstMediaUrl 
      ? resolveAssetUrl(firstMediaUrl) 
      : null;

  return (
    <div className="bg-white border border-black/10 shadow-sm transition-all">
      {/* 아코디언 헤더 */}
      <div 
        className="flex cursor-pointer items-center justify-between bg-gray-50 p-6 transition hover:bg-gray-100"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-6">
          <div className="h-[60px] w-[60px] shrink-0 bg-gray-200">
            {/* 💡 계산된 displayThumbnail을 사용하도록 변경! */}
            {displayThumbnail ? (
              <img src={displayThumbnail} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-[10px] text-gray-400">NO IMG</div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-[18px] font-bold">{item.title}</h3>
              <span className="bg-black px-2 py-1 text-[9px] text-white tracking-widest">{item.status}</span>
            </div>
            <p className="mt-1 text-[12px] text-gray-500">{item.subtitle}</p>
          </div>
        </div>
        <span className="text-xl text-gray-400">{isOpen ? "▲" : "▼"}</span>
      </div>

      {/* 아코디언 본문 (열렸을 때만 보임) */}
      {isOpen && (
        <div className="border-t border-black/10 p-8">
          <ProjectForm
            value={value}
            setValue={setValue}
            button="SAVE CHANGES"
            onSubmit={() => run(() => updateProject(item.id, value), "프로젝트를 수정했습니다.")}
            onDelete={() => confirm("정말 삭제하시겠습니까?") && run(() => deleteProject(item.id), "프로젝트를 삭제했습니다.")}
          />
          <ProjectMediaSection projectId={item.id} />
        </div>
      )}
    </div>
  );
}

// 💡 유효성 검사는 굳이 백앤드로 갈 필요가 없음. 
function ProjectForm({ value, setValue, onSubmit, onDelete, button }: {
  value: ProjectRequest; setValue:(v:ProjectRequest)=>void; onSubmit:()=>void; onDelete?:()=>void; button:string
}) {
  const field=(key:keyof ProjectRequest, v:any)=>setValue({...value,[key]:v});
  
  // 💡 저장 버튼을 눌렀을 때 API 호출 전 앞단에서 먼저 검사하는 함수
  const handleValidationAndSubmit = () => {
    // 필수 항목인 '제목(title)'이 비어있는지 검사 (공백만 있는 경우도 차단)
    if (!value.title || value.title.trim() === "") {
      alert("빈칸이 있으면 안됩니다. 프로젝트 제목을 입력해주세요.");
      return; // 폼 제출 중단
    }
    
    // 추가로 필수가 되어야 할 항목이 있다면 여기에 계속 추가하면 됩니다.
    if (!value.status) {
      alert("빈칸이 있으면 안됩니다. 프로젝트 상태를 선택해주세요.");
      return;
    }

    // 앞단 검사를 무사히 통과했다면 부모에게 전달받은 진짜 onSubmit(API 호출) 실행!
    onSubmit();
  };

  return (
    <div className="grid gap-6">
      
      {/* 섹션 1: 기본 정보 */}
      <div className="bg-[#fcfcfc] p-6 border border-gray-200">
        <h4 className="mb-4 text-[11px] font-bold tracking-widest text-gray-500">1. BASIC INFO</h4>
        <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
          <Input label="PROJECT TITLE (필수)" value={value.title} set={v=>field("title",v)} />
          <Input label="SUBTITLE (Overview)" value={value.subtitle ?? ""} set={v=>field("subtitle",v)} />
          <div className="col-span-2">
            <label><span className="mb-2 block text-[10px] font-bold tracking-[0.1em] text-gray-600">DESCRIPTION</span>
              <textarea 
                className="min-h-[120px] w-full border border-gray-300 p-4 text-[13px] outline-none transition focus:border-black" 
                value={value.description ?? ""} 
                onChange={e=>field("description",e.target.value)} 
                placeholder="프로젝트 상세 설명을 입력하세요."
              />
            </label>
          </div>
        </div>
      </div>

      {/* 섹션 2: 상태 및 기간 */}
      <div className="bg-[#fcfcfc] p-6 border border-gray-200">
        <h4 className="mb-4 text-[11px] font-bold tracking-widest text-gray-500">2. STATUS & PERIOD</h4>
        <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
          <label><span className="mb-2 block text-[10px] font-bold tracking-[0.1em] text-gray-600">STATUS (필수)</span>
            <select className="h-12 w-full border border-gray-300 px-4 text-[12px] outline-none focus:border-black" value={value.status} onChange={e=>field("status",e.target.value as ProjectStatus)}>
              <option value="PLANNING">PLANNING (기획 중)</option>
              <option value="IN_PROGRESS">IN PROGRESS (진행 중)</option>
              <option value="COMPLETED">COMPLETED (완료)</option>
            </select>
          </label>
          <Input label="START DATE" type="date" value={value.startDate ?? ""} set={v=>field("startDate",v || null)} />
          <Input label="END DATE" type="date" value={value.endDate ?? ""} set={v=>field("endDate",v || null)} />
        </div>
      </div>

      {/* 섹션 3: 메타 데이터 (스택, URL 등) */}
      <div className="bg-[#fcfcfc] p-6 border border-gray-200">
        <h4 className="mb-4 text-[11px] font-bold tracking-widest text-gray-500">3. META DATA</h4>
        <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
          <Input label="TECH STACK" value={value.techStack ?? ""} set={v=>field("techStack",v)} placeholder="e.g. React, Next.js, Spring Boot" />
          <Input label="THUMBNAIL URL" value={value.thumbnail ?? ""} set={v=>field("thumbnail",v)} />
          <Input label="LIVE PROJECT URL" value={value.projectUrl ?? ""} set={v=>field("projectUrl",v)} />
          <Input label="GITHUB URL" value={value.githubUrl ?? ""} set={v=>field("githubUrl",v)} />
        </div>
        
        <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-6">
          <div className="flex gap-6">
            <Input label="SORT ORDER (숫자가 작을수록 우선)" type="number" value={String(value.sortOrder)} set={v=>field("sortOrder",Number(v))} />
            <label className="flex cursor-pointer items-center gap-2 text-[12px] font-bold text-black pt-5">
              <input type="checkbox" className="h-4 w-4 accent-black" checked={value.isFeatured} onChange={e=>field("isFeatured",e.target.checked)} /> 
              MAIN 'FEATURED' 노출
            </label>
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex justify-end gap-3 pt-4">
        {onDelete && <button type="button" className="h-12 border border-red-200 px-6 text-[11px] font-bold tracking-widest text-red-500 transition hover:bg-red-50" onClick={onDelete}>DELETE PROJECT</button>}
        
        {/* 💡 기존 onSubmit -> handleValidationAndSubmit 으로 변경됨! */}
        <button type="button" className="h-12 bg-black px-10 text-[11px] font-bold tracking-widest text-white transition hover:bg-gray-800" onClick={handleValidationAndSubmit}>
          {button}
        </button>
      </div>
    </div>
  );
}

// 💡 [개선] 미디어 업로드 섹션 디자인 정리
function ProjectMediaSection({ projectId }: { projectId: number }) {
  const [items, setItems] = useState<ProjectMedia[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [altText, setAltText] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function reloadMedia() {
    try { setItems(await fetchProjectMedia(projectId)); } 
    catch (error:any) { setNotice(error.message); }
  }

  useEffect(() => { reloadMedia(); }, [projectId]);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function upload() {
    if (!file) return setNotice("업로드할 파일을 선택해주세요.");
    try {
      await createProjectMedia(projectId, { file, caption, altText, sortOrder });
      setFile(null); setCaption(""); setAltText(""); setSortOrder(0);
      await reloadMedia();
      setNotice("미디어가 등록되었습니다.");
    } catch (error:any) { setNotice(error.message); }
  }

  return (
    <div className="mt-12 border-t-2 border-black pt-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h3 className="text-[20px] font-bold tracking-[-0.04em]">Media Management</h3>
          <p className="mt-1 text-[11px] tracking-widest text-gray-500">이미지 및 비디오 업로드 ({items.length}개)</p>
        </div>
      </div>

      {items.length > 0 && (
        <div className="mb-10 grid grid-cols-2 gap-6 max-lg:grid-cols-1">
          {items.map((media) => <ProjectMediaItem key={media.id} item={media} projectId={projectId} onChanged={reloadMedia} />)}
        </div>
      )}

      {/* 미디어 업로드 폼 (박스형으로 강조) */}
      <div className="bg-gray-100 p-8 border border-gray-200">
        <h4 className="mb-6 text-[12px] font-bold tracking-widest">UPLOAD NEW MEDIA</h4>
        
        {preview && (
          <div className="mb-6 flex justify-center bg-white p-4 border border-gray-300">
            {file?.type.startsWith("video/") ? (
              <video src={preview} controls className="max-h-[300px] object-contain" />
            ) : (
              <img src={preview} alt="preview" className="max-h-[300px] object-contain" />
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-5 max-md:grid-cols-1">
          <label>
            <span className="mb-2 block text-[10px] font-bold tracking-[0.1em] text-gray-600">SELECT FILE</span>
            <label className="flex h-12 cursor-pointer items-center justify-between border border-gray-300 bg-white px-4 hover:border-black transition">
              <span className="truncate text-[12px] text-gray-500">{file ? file.name : "Choose an image or video..."}</span>
              <span className="bg-black text-white px-3 py-1 text-[10px]">BROWSE</span>
              <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                e.target.value = "";
              }} />
            </label>
          </label>
          <Input label="SORT ORDER" type="number" value={String(sortOrder)} set={(v) => setSortOrder(Number(v))} />
          <Input label="ALT TEXT" value={altText} set={setAltText} placeholder="시각장애인을 위한 대체 텍스트" />
          <Input label="CAPTION" value={caption} set={setCaption} placeholder="이미지 하단에 표시될 설명" />
        </div>

        <div className="mt-6 flex justify-end">
          <button type="button" onClick={upload} className="h-12 bg-black px-8 text-[11px] font-bold tracking-widest text-white transition hover:bg-gray-800">
            + UPLOAD MEDIA
          </button>
        </div>
        {notice && <p className="mt-4 text-right text-[11px] font-bold text-red-500">{notice}</p>}
      </div>
    </div>
  );
}

// 💡 등록된 미디어 아이템 수정 카드
function ProjectMediaItem({ item, projectId, onChanged }: { item: ProjectMedia; projectId: number; onChanged: () => Promise<void>; }) {
  const [caption, setCaption] = useState(item.caption ?? "");
  const [altText, setAltText] = useState(item.altText ?? "");
  const [sortOrder, setSortOrder] = useState(item.sortOrder ?? 0);
  const mediaUrl = resolveAssetUrl(item.mediaUrl);

  async function save() {
    await updateProjectMedia(projectId, item.id, { caption, altText, sortOrder });
    await onChanged();
  }
  async function remove() {
    if (!confirm("삭제할까요?")) return;
    await deleteProjectMedia(projectId, item.id);
    await onChanged();
  }

  return (
    <div className="flex flex-col border border-gray-200 bg-white shadow-sm">
      <div className="flex h-[200px] items-center justify-center bg-gray-50 p-2">
        {item.mediaType === "VIDEO" ? (
          <video src={mediaUrl ?? ""} controls className="h-full object-contain" />
        ) : (
          <img src={mediaUrl ?? ""} alt={altText} className="h-full object-contain" />
        )}
      </div>
      <div className="flex-1 p-5 border-t border-gray-100">
        <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-2">
          <span className="bg-black px-2 py-1 text-[9px] text-white tracking-widest">{item.mediaType}</span>
          <span className="text-[10px] text-gray-400">ID: {item.id}</span>
        </div>
        <div className="grid gap-3">
          <Input label="CAPTION" value={caption} set={setCaption} />
          <Input label="ALT TEXT" value={altText} set={setAltText} />
          <Input label="ORDER" type="number" value={String(sortOrder)} set={(v) => setSortOrder(Number(v))} />
        </div>
        <div className="mt-5 flex justify-end gap-2 pt-2 border-t border-gray-100">
          <button type="button" onClick={remove} className="h-10 px-4 text-[10px] font-bold text-red-500 hover:bg-red-50 border border-red-200">DELETE</button>
          <button type="button" onClick={save} className="h-10 px-4 text-[10px] font-bold bg-black text-white hover:bg-gray-800">SAVE</button>
        </div>
      </div>
    </div>
  );
}

function Input({label,value,set,type="text", placeholder=""}:{label:string;value:string;set:(v:string)=>void;type?:string, placeholder?:string}) {
  return (
    <label>
      <span className="mb-2 block text-[10px] font-bold tracking-[0.1em] text-gray-600">{label}</span>
      <input 
        type={type} 
        placeholder={placeholder}
        className="h-12 w-full border border-gray-300 px-4 text-[12px] outline-none transition focus:border-black" 
        value={value} 
        onChange={e=>set(e.target.value)} 
      />
    </label>
  );
}