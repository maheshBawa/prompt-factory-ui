export type UIPromptRequest = {
  project: { name: string; description: string };
  platform: { targets: ("web"|"ios"|"android"|"desktop"|"cross")[]; responsive: boolean; breakpoints?: ("sm"|"md"|"lg"|"xl")[] };
  fidelity?: "wireframe"|"high-fidelity"|"production-code";
  style?: {
    aesthetic?: string[];
    designSystem?: "material"|"fluent"|"bootstrap"|"tailwind"|"chakra"|"none"|"custom";
    brand?: { primaryColor?: string; secondaryColor?: string; fontFamily?: string; logoUrl?: string };
    modes?: ("light"|"dark"|"system")[];
  };
  users?: { roles?: string[]; accessControl?: boolean };
  flows?: string[];
  integrations?: ("maps"|"payments"|"calendar"|"push"|"analytics"|"auth-oauth"|"file-upload")[];
  localization?: { language?: string; region?: string; i18n?: boolean };
  accessibility?: { wcag?: "A"|"AA"|"AAA"; features?: ("keyboard"|"screen-reader"|"contrast"|"motion-reduce")[] };
  data?: { entities?: string[]; sampleRecordsNeeded?: boolean };
  screens: { name: string; priority?: number; mustHave?: boolean; notes?: string }[];
  output: {
    format: "description"|"component-spec"|"code-react"|"code-next"|"code-vue"|"code-flutter"|"code-swiftui";
    tech?: {
      react?: { useTypescript?: boolean; useTailwind?: boolean; state?: "none"|"zustand"|"redux"|"context" };
      flutter?: { state?: "provider"|"riverpod"|"bloc"|"none" };
    };
    deliverables?: ("component-files"|"story-examples"|"test-cases"|"figma-json"|"readme")[];
    constraints?: ("no-external-icons"|"no-third-party"|"tree-shakeable"|"a11y-annotations"|"comments-why")[];
  };
};

export const buildPrompt = (answers: UIPromptRequest) => {
  const json = JSON.stringify(answers, null, 2);
  return `You are a senior product designer and front-end engineer.
Build UI for the following context. Use sensible defaults for missing values.

<CONTEXT>
${json}
</CONTEXT>

Follow the TASK and RULES as specified in the system prompt.`;
};
