import { readJson, writeText } from "./io";
import { buildPrompt } from "./types";
import { SYSTEM_PROMPT, TASK_RULES } from "./promptTemplate";

const data = readJson("data/examples/vehicle-rental.json");
const prompt = [
  "SYSTEM:\n" + SYSTEM_PROMPT,
  "USER:\nBuild UI for a project with the following context (JSON follows). Interpret missing values sensibly.",
  "<CONTEXT>\n" + JSON.stringify(data, null, 2) + "\n</CONTEXT>",
  TASK_RULES,
].join("\n\n");

writeText("out/prompt_from_demo.txt", prompt);
console.log("Demo prompt written to out/prompt_from_demo.txt");
