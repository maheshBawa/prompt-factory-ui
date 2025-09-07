import inquirer from "inquirer";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import chalk from "chalk";
import schema from "./schema.json";
import questionnaire from "./questionnaire.json";
import { writeJson, writeText } from "./io";
import { UIPromptRequest, buildPrompt } from "./types";
import { SYSTEM_PROMPT, TASK_RULES } from "./promptTemplate";

/* -------------------- utils -------------------- */

// Deep get/set helpers
const getDeep = (obj: any, path: string) => {
  const segs = path.replace(/\[(\d+)\]/g, ".$1").split(".");
  return segs.reduce((acc, k) => (acc != null ? acc[k] : undefined), obj);
};
const setDeep = (obj: any, path: string, value: any) => {
  const segs = path.split(".");
  let cur = obj;
  segs.forEach((k, i) => {
    if (i === segs.length - 1) cur[k] = value;
    else cur[k] = cur[k] ?? {};
    cur = cur[k];
  });
};

// dependsOn parser (robust)
const isEnabled = (dependsOn: string | undefined, answers: any): boolean => {
  if (!dependsOn) return true;
  const m = dependsOn.match(/^(.+?)\s*(in|=)\s*(.+)$/i);
  if (!m) return true;

  const [, left, op, rightRaw] = m;
  const leftVal = getDeep(answers, left.trim());

  if (op.toLowerCase() === "=") {
    let right: any = rightRaw.trim();
    if (/^(true|false)$/i.test(right)) right = /true/i.test(right);
    else if (/^-?\d+(\.\d+)?$/.test(right)) right = Number(right);
    else right = right.replace(/^["']|["']$/g, "");
    return leftVal === right;
  }

  // op === "in"
  let listStr = rightRaw.trim();
  if (listStr.startsWith("[") && listStr.endsWith("]")) {
    let arr: any[] = [];
    try {
      arr = JSON.parse(listStr.replace(/'/g, '"'));
      if (!Array.isArray(arr)) arr = [];
    } catch {
      arr = listStr
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    }
    return arr.includes(leftVal);
  }
  const single = listStr.replace(/^["']|["']$/g, "");
  return leftVal === single;
};

type Question = {
  id: string;
  label: string;
  type:
    | "text"
    | "textarea"
    | "boolean"
    | "select"
    | "multiselect"
    | "chips"
    | "table";
  options?: string[];
  default?: any;
  required?: boolean;
  placeholder?: string;
  columns?: string[];
  dependsOn?: string;
};

// Build an Inquirer prompt with inline validation so we can re-ask just this one
const toInquirer = (q: Question, currentAnswers: any): any => {
  const base = {
    name: "value",
    message: q.label,
    validate: (val: any) => {
      // Required check
      if (q.required) {
        const emptyArr = Array.isArray(val) && val.length === 0;
        if (val === undefined || val === "" || emptyArr)
          return "This field is required.";
      }
      // Type-specific checks
      if (q.type === "table") {
        try {
          const parsed = typeof val === "string" ? JSON.parse(val) : val;
          if (!Array.isArray(parsed)) return "Please provide a JSON array.";
          if (q.columns && parsed.length) {
            const bad = parsed.find(
              (row: any) =>
                typeof row !== "object" || q.columns!.some((c) => !(c in row))
            );
            if (bad)
              return `Each row must contain keys: ${q.columns.join(", ")}`;
          }
        } catch {
          return 'Invalid JSON. Example: [{"name":"Home","priority":1,"mustHave":true}]';
        }
      }
      if (q.type === "select" && q.options && !q.options.includes(val)) {
        return `Pick one of: ${q.options.join(", ")}`;
      }
      if (q.type === "multiselect" && q.options) {
        const unknown = (val as string[]).filter(
          (v) => !q.options!.includes(v)
        );
        if (unknown.length)
          return `Unknown: ${unknown.join(", ")}. Allowed: ${q.options.join(
            ", "
          )}`;
      }
      return true;
    },
    filter: (val: any) => {
      if (q.type === "chips") {
        if (Array.isArray(val)) return val;
        return val
          ? String(val)
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean)
          : [];
      }
      if (q.type === "table") {
        if (Array.isArray(val)) return val;
        try {
          return JSON.parse(val);
        } catch {
          return [];
        }
      }
      return val;
    },
  };

  switch (q.type) {
    case "text":
    case "textarea":
      return { type: "input", ...base, default: q.default };

    case "boolean":
      return {
        type: "confirm",
        ...base,
        default: typeof q.default === "boolean" ? q.default : false,
      };

    case "select":
      return { type: "list", ...base, choices: q.options, default: q.default };

    case "multiselect":
      return {
        type: "checkbox",
        ...base,
        // Always pass {name, value} objects
        choices: (q.options ?? []).map((opt) => ({
          name: opt,
          value: String(opt),
        })),
        // Ensure default is an array of strings that exist in options
        default: Array.isArray(q.default)
          ? q.default.map(String).filter((v) => (q.options ?? []).includes(v))
          : [],
        // Stronger validate just for multiselect
        validate: (val: any) => {
          if (q.required && (!Array.isArray(val) || val.length === 0)) {
            return "Select at least one option.";
          }
          // Coerce any objects to value strings (defensive)
          const values: string[] = Array.isArray(val)
            ? val.map((v) =>
                typeof v === "object" && v !== null && "value" in v
                  ? (v as any).value
                  : String(v)
              )
            : [];

          const allowed = (q.options ?? []).map(String);
          const unknown = values.filter((v) => !allowed.includes(v));
          if (unknown.length) {
            return `Unknown: ${unknown.join(", ")}. Allowed: ${allowed.join(
              ", "
            )}`;
          }
          return true;
        },
        filter: (val: any) => {
          // Normalize output to array of strings
          if (!Array.isArray(val)) return [];
          return val.map((v) =>
            typeof v === "object" && v !== null && "value" in v
              ? (v as any).value
              : String(v)
          );
        },
        pageSize: Math.max(5, Math.min(12, (q.options ?? []).length || 5)),
      };

    case "chips":
      return {
        type: "input",
        ...base,
        // show comma-joined default for nicer UX if an array is provided
        default: Array.isArray(q.default) ? q.default.join(", ") : q.default,
        suffix: " (comma-separated)",
      };

    case "table":
      return {
        // Inquirer supports the "editor" prompt out of the box; set EDITOR if needed on Windows
        type: "editor",
        ...base,
        default: JSON.stringify(q.default ?? [], null, 2),
      };

    default:
      return { type: "input", ...base, default: q.default };
  }
};

// Ask one question with retry (never exits the app)
const askWithRetry = async (q: Question, answers: any) => {
  while (true) {
    const prompt = toInquirer(q, answers);
    const res = await inquirer.prompt([prompt]);
    const value = res.value;
    // inquirer.validate already ran; if it returned a string we'd still be here
    // but double-check for required arrays (checkbox with nothing selected & required)
    if (
      q.required &&
      (value === "" ||
        value === undefined ||
        (Array.isArray(value) && value.length === 0))
    ) {
      console.log(chalk.red("This field is required. Let's try again.\n"));
      continue;
    }
    setDeep(answers, q.id, value);
    break;
  }
};

// Convert an Ajv error.instancePath like "/project/name" into "project.name"
const ajvPathToId = (path: string) =>
  path.replace(/^\//, "").replace(/\//g, ".");

/* -------------------- main -------------------- */

(async () => {
  console.log(chalk.cyanBright("\n▶ Prompt Factory — UI Builder\n"));

  const answers: any = {};

  // 1) Primary pass — ask all enabled questions with per-question retry
  for (const q of questionnaire as Question[]) {
    if (!isEnabled(q.dependsOn, answers)) continue;
    await askWithRetry(q, answers);
  }

  // 2) Schema validation — if it fails, re-ask ONLY the failing fields
  const ajv = new Ajv({ allErrors: true, allowUnionTypes: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);

  let pass = 1;
  const MAX_FIX_PASSES = 3;
  while (!validate(answers) && pass <= MAX_FIX_PASSES) {
    console.log(
      chalk.yellow(`\nSome inputs need fixes (pass ${pass}/${MAX_FIX_PASSES}):`)
    );
    // Collect unique failing paths → map to question IDs present in questionnaire
    const failingIds = new Set<string>();
    for (const err of validate.errors ?? []) {
      if (!err.instancePath) continue;
      const id = ajvPathToId(err.instancePath);
      // find the closest question that matches (exact id or prefix match for nested objects)
      const qs = (questionnaire as Question[]).filter(
        (q) => q.id === id || id.startsWith(q.id + ".")
      );
      // If nothing matches (e.g., missing required property), try the required property's name if present
      if (qs.length === 0 && (err.params as any)?.missingProperty) {
        const mp = (err.params as any).missingProperty as string;
        const guess = `${id ? id + "." : ""}${mp}`;
        const qGuess = (questionnaire as Question[]).find(
          (q) => q.id === guess
        );
        if (qGuess) qs.push(qGuess);
      }
      for (const q of qs) failingIds.add(q.id);
      // Print a small human message
      console.log(` - ${id || "(root)"} ${err.message}`);
    }

    if (failingIds.size === 0) break; // nothing we can re-ask; avoid loop

    // Re-ask only those
    for (const id of failingIds) {
      const q = (questionnaire as Question[]).find((x) => x.id === id);
      if (!q) continue;
      if (!isEnabled(q.dependsOn, answers)) continue; // still honor dependsOn
      await askWithRetry(q, answers);
    }

    pass++;
  }

  if (!validate(answers)) {
    console.log(
      chalk.red(
        "\nCould not validate after multiple passes. Please review the errors above."
      )
    );
    process.exit(1);
  }

  // 3) Build prompt & save
  const promptText = [
    "SYSTEM:\n" + SYSTEM_PROMPT,
    "USER:\nBuild UI for a project with the following context (JSON follows). Interpret missing values sensibly.",
    "<CONTEXT>\n" + JSON.stringify(answers, null, 2) + "\n</CONTEXT>",
    TASK_RULES,
  ].join("\n\n");

  writeJson("out/answers.json", answers as UIPromptRequest);
  writeText("out/prompt.txt", promptText);

  console.log(chalk.green("\n✓ Answers saved to out/answers.json"));
  console.log(chalk.green("✓ Prompt saved to out/prompt.txt\n"));
  console.log(
    chalk.yellow(
      "Next: paste out/prompt.txt into your Custom GPT, or send via API.\n"
    )
  );
})();
