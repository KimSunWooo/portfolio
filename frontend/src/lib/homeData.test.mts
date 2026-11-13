import assert from "node:assert/strict";
import { test } from "node:test";
import {
  HOME_FETCH_TIMEOUT_MS,
  PUBLIC_FEATURED_PROJECT_FALLBACK,
  loadHomeContent,
  mergeResume,
  resolveProjects,
  withTimeout,
} from "./homeData.mts";

type TestResume = {
  profile?: { name: string; jobTitle?: string } | null;
  skills: { id: number; name: string }[];
  experiences: { id: number }[];
  educations: { id: number }[];
  introductions: { id: number; title: string; content: string }[];
};

const fallback: TestResume = {
  profile: { name: "김선우", jobTitle: "Developer" },
  skills: [{ id: 1, name: "Java" }],
  experiences: [{ id: 1 }],
  educations: [{ id: 1 }],
  introductions: [{ id: 1, title: "intro", content: "body" }],
};

test("mergeResume keeps fallback sections when API returns empty arrays", () => {
  const merged = mergeResume(
    {
      profile: { name: "API" },
      skills: [],
      experiences: [],
      educations: [],
      introductions: [],
    },
    fallback
  );
  assert.equal(merged.profile?.name, "API");
  assert.equal(merged.skills[0]?.name, "Java");
  assert.equal(merged.experiences.length, 1);
});

test("resolveProjects uses public fallback on rejection", () => {
  const rejected = resolveProjects({
    status: "rejected",
    reason: new Error("boom"),
  });
  assert.deepEqual(rejected, PUBLIC_FEATURED_PROJECT_FALLBACK);
});

test("withTimeout rejects slow promises", async () => {
  await assert.rejects(
    () =>
      withTimeout(
        new Promise((resolve) => setTimeout(resolve, 200)),
        30,
        "slow"
      ),
    /timed out/
  );
});

test("loadHomeContent fetches resume and projects in parallel and tolerates one failure", async () => {
  const order: string[] = [];
  const { resume, projects } = await loadHomeContent({
    timeoutMs: 200,
    fallbackResume: fallback,
    fetchResume: async (): Promise<TestResume> => {
      order.push("resume-start");
      await new Promise((r) => setTimeout(r, 20));
      order.push("resume-end");
      return {
        profile: { name: "Live" },
        skills: [{ id: 9, name: "Redis" }],
        experiences: fallback.experiences,
        educations: fallback.educations,
        introductions: fallback.introductions,
      };
    },
    fetchProjects: async () => {
      order.push("projects-start");
      throw new Error("projects down");
    },
  });

  assert.ok(order.indexOf("resume-start") >= 0);
  assert.ok(order.indexOf("projects-start") >= 0);
  assert.ok(order.indexOf("projects-start") < order.indexOf("resume-end"));
  assert.equal(resume.profile?.name, "Live");
  assert.equal(resume.skills[0]?.name, "Redis");
  assert.deepEqual(projects, PUBLIC_FEATURED_PROJECT_FALLBACK);
});

test("loadHomeContent uses resume fallback when resume times out", async () => {
  const { resume, projects } = await loadHomeContent({
    timeoutMs: 40,
    fallbackResume: fallback,
    fetchResume: async () => {
      await new Promise((r) => setTimeout(r, 200));
      return fallback;
    },
    fetchProjects: async () => [{ id: 7, title: "Ok", status: "COMPLETED" }],
  });
  assert.equal(resume.profile?.name, "김선우");
  assert.equal(projects[0]?.id, 7);
  assert.ok(HOME_FETCH_TIMEOUT_MS >= 1000);
});
