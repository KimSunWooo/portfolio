export type IntroSection = {
  id: string;
  title: string;
  body: string;
};

export function splitIntroductionSections(content: string): {
  heading?: string;
  lead: string;
  sections: IntroSection[];
} {
  const normalized = trimBlankLines(content.replace(/\r\n?/g, "\n"));
  if (!normalized.trim()) return { lead: "", sections: [] };

  const lead: string[] = [];
  const sections: { title: string; lines: string[] }[] = [];
  let lines = lead;
  let fence = "";

  for (const line of normalized.split("\n")) {
    const marker = /^ {0,3}(\x60{3,}|~{3,})(.*)$/.exec(line);
    if (fence) {
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) {
        fence = "";
      }
      lines.push(line);
      continue;
    }
    if (marker) fence = marker[1];

    const heading = /^ {0,3}##[ \t]+(.+)$/.exec(line);
    if (heading) {
      const title = heading[1].replace(/[ \t]+#+[ \t]*$/, "").trim();
      lines = [];
      sections.push({ title: title || "섹션 " + (sections.length + 1), lines });
    } else {
      lines.push(line);
    }
  }

  if (!sections.length) {
    return { lead: "", sections: [{ id: "full", title: "소개", body: normalized }] };
  }

  const leadText = lead.join("\n");
  const heading = /^#[ \t]+([^\n]+)\n*/.exec(leadText);
  return {
    heading: heading?.[1].trim(),
    lead: trimBlankLines(heading ? leadText.slice(heading[0].length) : leadText),
    sections: sections.map(({ title, lines }, index) => ({
      id: "section-" + index,
      title,
      body: trimBlankLines(lines.join("\n")),
    })),
  };
}

function trimBlankLines(markdown: string) {
  return markdown.replace(/^(?:[ \t]*\n)+|(?:\n[ \t]*)+$/g, "");
}
