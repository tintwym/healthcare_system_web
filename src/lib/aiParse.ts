/** Shared parsers for Medicore Assist structured replies. */

export type ParsedSummaryDraft = {
  course: string;
  instructions: string;
  warnings: string[];
};

/** Parse COURSE / INSTRUCTIONS / WARNINGS blocks from an Assist draft_summary reply. */
export function parseSummaryDraft(reply: string): ParsedSummaryDraft {
  const text = (reply || '').trim();
  const course = sectionBody(text, 'COURSE') || stripMarkdownNoise(text);
  const instructions =
    sectionBody(text, 'INSTRUCTIONS') ||
    'Follow up with your care team as scheduled. Continue medications as prescribed.';
  const warningsRaw = sectionBody(text, 'WARNINGS');
  const warnings = warningsRaw
    ? warningsRaw
        .split('\n')
        .map((l) => l.replace(/^[-*•]\s*/, '').trim())
        .filter(Boolean)
        .slice(0, 6)
    : [
        'Chest pain, shortness of breath, or sudden weakness',
        'Fever >100.4°F lasting more than 24 hours',
        'Uncontrolled bleeding, severe headache, or confusion',
      ];

  return { course: course.trim(), instructions: instructions.trim(), warnings };
}

/** Clean a draft_message reply into paste-ready composer text. */
export function parseMessageDraft(reply: string): string {
  let text = (reply || '').trim();
  text = text.replace(/^```[\w]*\n?|\n?```$/g, '').trim();
  text = text.replace(/^\s*["“]|["”]\s*$/g, '').trim();
  // Drop common footer lines from older fallbacks / model habit
  text = text
    .split('\n')
    .filter((line) => {
      const l = line.toLowerCase();
      return (
        !l.includes('ai provider key') &&
        !l.includes('advisory only') &&
        !l.includes('not a diagnosis') &&
        !l.startsWith('(edit before')
      );
    })
    .join('\n')
    .trim();
  return text.slice(0, 2000);
}

function sectionBody(text: string, heading: string): string | null {
  const re = new RegExp(
    `(?:^|\\n)\\s*#{0,3}\\s*${heading}\\s*:?\\s*\\n([\\s\\S]*?)(?=(?:\\n\\s*#{0,3}\\s*(?:COURSE|INSTRUCTIONS|WARNINGS)\\s*:?)|$)`,
    'i'
  );
  const m = text.match(re);
  return m?.[1]?.trim() || null;
}

function stripMarkdownNoise(text: string): string {
  return text
    .replace(/^#+\s*/gm, '')
    .replace(/\*\*/g, '')
    .trim();
}
