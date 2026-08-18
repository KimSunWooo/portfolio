"use client";

import { useEffect, useState } from "react";
import { createProject, deleteProject, fetchProjects, updateProject, type PortfolioProject, type ProjectRequest, type ProjectStatus } from "../../lib/api";

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

function ProjectRow({ item, run }: { item: PortfolioProject; run: (a:()=>Promise<unknown>,m:string)=>Promise<void> }) {
  const [value, setValue] = useState<ProjectRequest>(item);
  return <div className="border-b border-black/15 py-8">
    <ProjectForm value={value} setValue={setValue} button="SAVE"
      onSubmit={() => run(() => updateProject(item.id, value), "프로젝트를 수정했습니다.")}
      onDelete={() => confirm("삭제할까요?") && run(() => deleteProject(item.id), "프로젝트를 삭제했습니다.")} />
  </div>;
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
function Input({label,value,set,type="text"}:{label:string;value:string;set:(v:string)=>void;type?:string}) {
  return <label><span className="mb-2 block text-[9px] tracking-[0.14em] text-[#777]">{label}</span>
    <input type={type} className="h-11 w-full border border-black/20 px-3 text-[12px]" value={value} onChange={e=>set(e.target.value)} />
  </label>;
}
