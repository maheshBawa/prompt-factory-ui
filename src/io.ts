import fs from "fs";
import path from "path";

export const writeText = (filePath: string, content: string) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
};

export const writeJson = (filePath: string, obj: unknown) => {
  writeText(filePath, JSON.stringify(obj, null, 2));
};

export const readJson = <T = any>(filePath: string): T =>
  JSON.parse(fs.readFileSync(filePath, "utf8"));
