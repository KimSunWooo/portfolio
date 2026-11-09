export type IntroSection = {
  id: string;
  title: string;
  preview: string;
  body: string;
};

export function splitIntroductionSections(content: string): {
  lead: string;
  sections: IntroSection[];
} {
  const normalized = content.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return { lead: "", sections: [] };
  }

  const parts = normalized.split(/\n(?=##\s+)/);
  if (parts.length === 1 && !parts[0].startsWith("## ")) {
    const preview = plainPreview(parts[0]);
    return {
      lead: "",
      sections: [{ id: "full", title: "소개", preview, body: parts[0] }],
    };
  }

  const lead = parts[0].startsWith("## ") ? "" : stripLeadingAtxH1(parts[0].trim());
  const sectionParts = parts[0].startsWith("## ") ? parts : parts.slice(1);
  const sections = sectionParts.map((part, index) => {
    const lines = part.split("\n");
    const title = lines[0].replace(/^##\s+/, "").trim() || `섹션 ${index + 1}`;
    const body = part.trim();
    return {
      id: `section-${index}`,
      title,
      preview: plainPreview(lines.slice(1).join("\n")),
      body,
    };
  });
  return { lead, sections };
}

function stripLeadingAtxH1(markdown: string): string {
  return markdown.replace(/^#\s+[^\n]*\n+/, "").trim();
}

function plainPreview(markdown: string): string {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= 120) {
    return text;
  }
  return `${text.slice(0, 117)}…`;
}
