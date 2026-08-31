"use client";

import { useEffect, useState } from "react";
import {
  createResumeEducation,
  createResumeExperience,
  createResumeIntroduction,
  createResumeSkill,
  deleteResumeEducation,
  deleteResumeExperience,
  deleteResumeIntroduction,
  deleteResumeSkill,
  fetchResume,
  updateResumeEducation,
  updateResumeExperience,
  updateResumeIntroduction,
  updateResumeProfile,
  updateResumeSkill,
  type ResumeData,
  type ResumeEducation,
  type ResumeExperience,
  type ResumeIntroduction,
  type ResumeProfile,
  type ResumeSkill,
} from "../../lib/api";

const emptyProfile: ResumeProfile = {
  name: "",
  jobTitle: "",
  email: "",
  phone: "",
  githubUrl: "",
  profileImage: "",
  shortIntro: "",
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

function resolveBackendAssetUrl(path?: string | null) {
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

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[9px] tracking-[0.14em] text-[#777]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full border border-black/20 bg-white px-3 text-[12px] outline-none focus:border-black"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[9px] tracking-[0.14em] text-[#777]">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[130px] w-full resize-y border border-black/20 bg-white p-3 text-[12px] leading-6 outline-none focus:border-black"
      />
    </label>
  );
}

function ActionButton({
  children,
  onClick,
  danger = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 border px-4 text-[9px] tracking-[0.12em] transition ${
        danger ? "border-red-300 text-red-600 hover:bg-red-50" : "border-black hover:bg-black hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

export default function ResumeAdmin() {
  const [data, setData] = useState<ResumeData | null>(null);
  const [profile, setProfile] = useState<ResumeProfile>(emptyProfile);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [initialLoadError, setInitialLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] =
    useState<string | null>(null);

  const savedProfileImageUrl = resolveBackendAssetUrl(profile.profileImage);

  async function reload(options?: { showErrorModal?: boolean }) {
    setLoading(true);
    try {
      const next = await fetchResume();
      setData(next);
      setProfile(next.profile ?? emptyProfile);
      setInitialLoadError(null);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "데이터를 불러오지 못했습니다.";

      if (options?.showErrorModal) {
        setNotification({ type: "error", message });
      } else {
        setInitialLoadError(message);
      }
      return false;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!profileImage) {
      setProfileImagePreview(null);
      return;
    }

    const url = URL.createObjectURL(profileImage);

    setProfileImagePreview(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [profileImage]);

  useEffect(() => {
    let cancelled = false;

    async function initialLoad() {
      const loaded = await reload();
      if (loaded || cancelled) return;

      await new Promise((resolve) => window.setTimeout(resolve, 600));
      if (!cancelled) await reload();
    }

    initialLoad();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!notification) return;

    const timer = window.setTimeout(() => {
      setNotification(null);
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [notification]);

  async function run(action: () => Promise<unknown>, success: string) {
    try {
      await action();
      const reloaded = await reload({ showErrorModal: true });
      if (reloaded) {
        setNotification({ type: "success", message: success });
      }
    } catch (error) {
      setNotification({ type: "error", message: error instanceof Error ? error.message : "요청에 실패했습니다." });
    }
  }

  async function saveProfile() {
    try {
      // 💡 JSON이 아닌 FormData 규격으로 데이터를 포장합니다.
      const formData = new FormData();
      formData.append("name", profile.name ?? "");
      formData.append("jobTitle", profile.jobTitle ?? "");
      formData.append("email", profile.email ?? "");
      formData.append("phone", profile.phone ?? "");
      formData.append("githubUrl", profile.githubUrl ?? "");
      formData.append("shortIntro", profile.shortIntro ?? "");
      
      // 이미지가 첨부되었을 때만 폼 데이터에 추가
      if (profileImage) {
        formData.append("profileImage", profileImage);
      }

      // 💡 api.ts의 updateResumeProfile로 FormData 객체를 전달
      await updateResumeProfile(formData);

      setProfileImage(null);

      const reloaded = await reload({ showErrorModal: true });

      if (reloaded) {
        setNotification({
          type: "success",
          message: "프로필을 저장했습니다.",
        });
      }
    } catch (error) {
      setNotification({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "요청에 실패했습니다.",
      });
    }
  }

  if (loading && !data) {
    return <div className="mx-auto max-w-[1440px] px-7 py-24 text-[12px]">LOADING...</div>;
  }

  return (
    <>
      {notification && (
        <NotificationModal
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="mx-auto max-w-[1440px] px-7 py-20 max-sm:px-4">
      <div className="mb-16 flex items-end justify-between border-b border-black pb-6">
        <div>
          <p className="text-[10px] tracking-[0.16em] text-[#777]">ADMIN · RESUME CMS</p>
          <h1 className="mt-3 text-[clamp(44px,7vw,92px)] font-normal tracking-[-0.06em]">Edit Resume</h1>
        </div>
        <a href="/" className="text-[10px] tracking-[0.12em] text-black no-underline">VIEW SITE ↗</a>
      </div>

      {initialLoadError && !loading && (
        <div className="mb-10 flex items-center justify-between gap-5 border border-black/15 bg-[#f5f4f2] px-4 py-3">
          <div>
            <p className="text-[9px] tracking-[0.14em] text-[#777]">API CONNECTION</p>
            <p className="mt-1 text-[11px] text-[#555]">백엔드 데이터를 불러오지 못했습니다. 서버 상태를 확인한 뒤 다시 시도해주세요.</p>
          </div>
          <button
            type="button"
            onClick={() => reload()}
            className="h-9 shrink-0 border border-black px-4 text-[9px] tracking-[0.12em] transition hover:bg-black hover:text-white"
          >
            RETRY
          </button>
        </div>
      )}

      <section className="border-t border-black py-10">
        <div className="grid grid-cols-[220px_1fr] gap-10 max-md:grid-cols-1">
          <div>
            <h2 className="text-[11px] tracking-[0.14em]">
              PROFILE
            </h2>
            
          {/* ✅ 클릭 가능한 이미지 업로드 영역으로 변경된 부분 */}
          <label className="group relative mt-4 flex min-h-[320px] cursor-pointer items-center justify-center overflow-hidden border-b border-black/10 bg-[#f5f4f2] transition-colors hover:bg-[#ebeae8]">
            {profileImagePreview || savedProfileImageUrl ? (
              <img
                src={profileImagePreview || savedProfileImageUrl || ""}
                alt={profile.name ?? "Profile"}
                className="h-[260px] w-[200px] object-cover transition duration-300 group-hover:opacity-40"
              />
            ) : (
              <div className="flex h-[260px] w-[200px] items-center justify-center border border-black/10 text-[9px] tracking-[0.14em] text-[#aaa]">
                PROFILE IMAGE
              </div>
            )}
            
            {/* Hover 시 나타나는 문구 */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <span className="border border-black bg-white px-3 py-2 text-[9px] tracking-[0.14em] text-black">
                CHANGE IMAGE
              </span>
            </div>

            {/* 숨겨진 파일 인풋 */}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setProfileImage(file);
                e.target.value = "";
              }}
            />
          </label>

            <p className="mt-3 text-[9px] leading-5 text-[#999]">
              클릭하여 이미지를 변경할 수 있습니다.<br/>
              저장 버튼을 눌러야 반영됩니다.
            </p>  
          </div>


          <div>
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <Field
                label="NAME"
                value={profile.name ?? ""}
                onChange={(v) =>
                  setProfile({ ...profile, name: v })
                }
              />

              <Field
                label="JOB TITLE"
                value={profile.jobTitle ?? ""}
                onChange={(v) =>
                  setProfile({ ...profile, jobTitle: v })
                }
              />

              <Field
                label="EMAIL"
                value={profile.email ?? ""}
                onChange={(v) =>
                  setProfile({ ...profile, email: v })
                }
              />

              <Field
                label="PHONE"
                value={profile.phone ?? ""}
                onChange={(v) =>
                  setProfile({ ...profile, phone: v })
                }
              />

              <Field
                label="GITHUB URL"
                value={profile.githubUrl ?? ""}
                onChange={(v) =>
                  setProfile({ ...profile, githubUrl: v })
                }
              />
              {/* ✅ 우측의 ProfileImage 컴포넌트 제거 (좌측 이미지 영역과 통합됨) */}
            </div>

            <div className="mt-4">
              <TextArea
                label="SHORT INTRO"
                value={profile.shortIntro ?? ""}
                onChange={(v) =>
                  setProfile({ ...profile, shortIntro: v })
                }
              />
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-4">
              <p className="text-[8px] tracking-[0.1em] text-[#999]">
                CHANGES ARE APPLIED AFTER SAVING
              </p>

              <ActionButton onClick={saveProfile}>
                SAVE PROFILE
              </ActionButton>
            </div>
          </div>
        </div>
      </section>

      <SkillSection items={data?.skills ?? []} run={run} />
      <ExperienceSection items={data?.experiences ?? []} run={run} />
      <EducationSection items={data?.educations ?? []} run={run} />
      <IntroductionSection items={data?.introductions ?? []} run={run} />
      </div>
    </>
  );
}

function NotificationModal({
  type,
  message,
  onClose,
}: {
  type: "success" | "error";
  message: string;
  onClose: () => void;
}) {
  const isSuccess = type === "success";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/20 px-4 backdrop-blur-[1px]"
      role="alertdialog"
      aria-modal="true"
      aria-label={isSuccess ? "처리 완료" : "오류 알림"}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[420px] border border-black bg-white p-7 shadow-[0_20px_70px_rgba(0,0,0,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className={`text-[9px] tracking-[0.18em] ${isSuccess ? "text-[#777]" : "text-red-600"}`}>
              {isSuccess ? "SUCCESS" : "ERROR"}
            </p>
            <h2 className="mt-3 text-[22px] font-normal tracking-[-0.04em]">
              {isSuccess ? "저장되었습니다." : "처리하지 못했습니다."}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center border border-black/20 text-[15px] transition hover:bg-black hover:text-white"
            aria-label="알림 닫기"
          >
            ×
          </button>
        </div>

        <p className="mt-5 border-t border-black/10 pt-5 text-[12px] leading-6 text-[#555]">
          {message}
        </p>

        <div className="mt-6 h-[2px] overflow-hidden bg-black/10">
          <div className={`h-full w-full origin-left animate-[adminNotice_2.2s_linear_forwards] ${isSuccess ? "bg-black" : "bg-red-500"}`} />
        </div>
      </div>
    </div>
  );
}

function SkillSection({ items, run }: { items: ResumeSkill[]; run: (action: () => Promise<unknown>, success: string) => Promise<void> }) {
  const [draft, setDraft] = useState<Omit<ResumeSkill, "id">>({ name: "", category: "", level: "", sortOrder: items.length + 1 });
  return (
    <AdminSection title="SKILLS">
      {items.map((item) => <SkillRow key={item.id} item={item} run={run} />)}
      <div className="grid grid-cols-[1fr_1fr_1fr_90px_auto] gap-3 border-b border-black/10 py-4 max-lg:grid-cols-2">
        <Field label="NAME" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
        <Field label="CATEGORY" value={draft.category ?? ""} onChange={(v) => setDraft({ ...draft, category: v })} />
        <Field label="LEVEL" value={draft.level ?? ""} onChange={(v) => setDraft({ ...draft, level: v })} />
        <Field label="ORDER" type="number" value={String(draft.sortOrder ?? 0)} onChange={(v) => setDraft({ ...draft, sortOrder: Number(v) })} />
        <div className="self-end"><ActionButton onClick={() => run(() => createResumeSkill(draft), "기술을 추가했습니다.")}>+ ADD</ActionButton></div>
      </div>
    </AdminSection>
  );
}

function SkillRow({ item, run }: { item: ResumeSkill; run: (action: () => Promise<unknown>, success: string) => Promise<void> }) {
  const [value, setValue] = useState<Omit<ResumeSkill, "id">>(item);
  return (
    <div className="grid grid-cols-[1fr_1fr_1fr_90px_auto] gap-3 border-b border-black/10 py-4 max-lg:grid-cols-2">
      <Field label="NAME" value={value.name} onChange={(v) => setValue({ ...value, name: v })} />
      <Field label="CATEGORY" value={value.category ?? ""} onChange={(v) => setValue({ ...value, category: v })} />
      <Field label="LEVEL" value={value.level ?? ""} onChange={(v) => setValue({ ...value, level: v })} />
      <Field label="ORDER" type="number" value={String(value.sortOrder ?? 0)} onChange={(v) => setValue({ ...value, sortOrder: Number(v) })} />
      <div className="flex items-end gap-2">
        <ActionButton onClick={() => run(() => updateResumeSkill(item.id, value), "기술을 수정했습니다.")}>SAVE</ActionButton>
        <ActionButton danger onClick={() => confirm("삭제할까요?") && run(() => deleteResumeSkill(item.id), "기술을 삭제했습니다.")}>DELETE</ActionButton>
      </div>
    </div>
  );
}

function ExperienceSection({ items, run }: { items: ResumeExperience[]; run: (action: () => Promise<unknown>, success: string) => Promise<void> }) {
  return (
    <AdminSection title="EXPERIENCE">
      {items.map((item) => <ExperienceRow key={item.id} item={item} run={run} />)}
      <ExperienceRow item={{ id: 0, companyName: "", position: "", startDate: "", endDate: "", description: "", sortOrder: items.length + 1 }} run={run} create />
    </AdminSection>
  );
}

function ExperienceRow({ item, run, create = false }: { item: ResumeExperience; run: (action: () => Promise<unknown>, success: string) => Promise<void>; create?: boolean }) {
  const [value, setValue] = useState<Omit<ResumeExperience, "id">>(item);
  return (
    <div className="border-b border-black/10 py-5">
      <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
        <Field label="COMPANY" value={value.companyName} onChange={(v) => setValue({ ...value, companyName: v })} />
        <Field label="POSITION" value={value.position ?? ""} onChange={(v) => setValue({ ...value, position: v })} />
        <Field label="START DATE" type="date" value={value.startDate ?? ""} onChange={(v) => setValue({ ...value, startDate: v || null })} />
        <Field label="END DATE" type="date" value={value.endDate ?? ""} onChange={(v) => setValue({ ...value, endDate: v || null })} />
      </div>
      <div className="mt-3"><TextArea label="DESCRIPTION" value={value.description ?? ""} onChange={(v) => setValue({ ...value, description: v })} /></div>
      <div className="mt-3 flex justify-end gap-2">
        <ActionButton onClick={() => run(() => create ? createResumeExperience(value) : updateResumeExperience(item.id, value), create ? "경력을 추가했습니다." : "경력을 수정했습니다.")}>{create ? "+ ADD" : "SAVE"}</ActionButton>
        {!create && <ActionButton danger onClick={() => confirm("삭제할까요?") && run(() => deleteResumeExperience(item.id), "경력을 삭제했습니다.")}>DELETE</ActionButton>}
      </div>
    </div>
  );
}

function EducationSection({ items, run }: { items: ResumeEducation[]; run: (action: () => Promise<unknown>, success: string) => Promise<void> }) {
  return (
    <AdminSection title="EDUCATION">
      {items.map((item) => <EducationRow key={item.id} item={item} run={run} />)}
      <EducationRow item={{ id: 0, schoolName: "", major: "", startDate: "", endDate: "", description: "", sortOrder: items.length + 1 }} run={run} create />
    </AdminSection>
  );
}

function EducationRow({ item, run, create = false }: { item: ResumeEducation; run: (action: () => Promise<unknown>, success: string) => Promise<void>; create?: boolean }) {
  const [value, setValue] = useState<Omit<ResumeEducation, "id">>(item);
  return (
    <div className="grid grid-cols-2 gap-3 border-b border-black/10 py-5 max-sm:grid-cols-1">
      <Field label="SCHOOL" value={value.schoolName} onChange={(v) => setValue({ ...value, schoolName: v })} />
      <Field label="MAJOR" value={value.major ?? ""} onChange={(v) => setValue({ ...value, major: v })} />
      <Field label="START DATE" type="date" value={value.startDate ?? ""} onChange={(v) => setValue({ ...value, startDate: v || null })} />
      <Field label="END DATE" type="date" value={value.endDate ?? ""} onChange={(v) => setValue({ ...value, endDate: v || null })} />
      <Field label="DESCRIPTION" value={value.description ?? ""} onChange={(v) => setValue({ ...value, description: v })} />
      <div className="flex items-end gap-2">
        <ActionButton onClick={() => run(() => create ? createResumeEducation(value) : updateResumeEducation(item.id, value), create ? "학력을 추가했습니다." : "학력을 수정했습니다.")}>{create ? "+ ADD" : "SAVE"}</ActionButton>
        {!create && <ActionButton danger onClick={() => confirm("삭제할까요?") && run(() => deleteResumeEducation(item.id), "학력을 삭제했습니다.")}>DELETE</ActionButton>}
      </div>
    </div>
  );
}

function IntroductionSection({ items, run }: { items: ResumeIntroduction[]; run: (action: () => Promise<unknown>, success: string) => Promise<void> }) {
  return (
    <AdminSection title="INTRODUCTION">
      {items.map((item) => <IntroductionRow key={item.id} item={item} run={run} />)}
      <IntroductionRow item={{ id: 0, title: "", content: "", sortOrder: items.length + 1 }} run={run} create />
    </AdminSection>
  );
}

function IntroductionRow({ item, run, create = false }: { item: ResumeIntroduction; run: (action: () => Promise<unknown>, success: string) => Promise<void>; create?: boolean }) {
  const [value, setValue] = useState<Omit<ResumeIntroduction, "id">>(item);
  return (
    <div className="border-b border-black/10 py-5">
      <Field label="TITLE" value={value.title ?? ""} onChange={(v) => setValue({ ...value, title: v })} />
      <div className="mt-3"><TextArea label="CONTENT" value={value.content} onChange={(v) => setValue({ ...value, content: v })} /></div>
      <div className="mt-3 flex justify-end gap-2">
        <ActionButton onClick={() => run(() => create ? createResumeIntroduction(value) : updateResumeIntroduction(item.id, value), create ? "소개글을 추가했습니다." : "소개글을 수정했습니다.")}>{create ? "+ ADD" : "SAVE"}</ActionButton>
        {!create && <ActionButton danger onClick={() => confirm("삭제할까요?") && run(() => deleteResumeIntroduction(item.id), "소개글을 삭제했습니다.")}>DELETE</ActionButton>}
      </div>
    </div>
  );
}

function AdminSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-black py-10">
      <div className="grid grid-cols-[220px_1fr] gap-10 max-md:grid-cols-1">
        <h2 className="text-[11px] tracking-[0.14em]">{title}</h2>
        <div>{children}</div>
      </div>
    </section>
  );
}