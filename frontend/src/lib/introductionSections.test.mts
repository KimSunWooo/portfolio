import assert from "node:assert/strict";
import test from "node:test";
import { splitIntroductionSections } from "../components/home/introductionSections.ts";

test("splits markdown by h2 headings and keeps lead", () => {
  const { lead, sections } = splitIntroductionSections(`# 제목

도입 문단입니다.

## 첫 섹션

첫 본문입니다.

## 둘째 섹션

둘째 본문입니다.
`);
  assert.equal(lead, "도입 문단입니다.");
  assert.equal(sections.length, 2);
  assert.equal(sections[0].title, "첫 섹션");
  assert.match(sections[0].preview, /첫 본문/);
  assert.match(sections[1].body, /## 둘째 섹션/);
});

test("renders a single card when headings are absent", () => {
  const { lead, sections } = splitIntroductionSections("한 덩어리 소개글입니다.");
  assert.equal(lead, "");
  assert.equal(sections.length, 1);
  assert.equal(sections[0].title, "소개");
});
