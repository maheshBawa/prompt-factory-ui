# Prompt Factory UI 🏗️

An interactive **CLI tool** that helps you generate structured prompts for building **web and mobile UIs**.  
Instead of writing long instructions manually, this project asks you the right questions (platforms, design system, screens, flows, etc.), validates your answers, and outputs a polished prompt you can drop into:

- a **Custom GPT**
- or your own **API pipeline**

---

## ✨ Features
- Interactive questionnaire (Inquirer-based)
- Schema validation (Ajv) → ensures answers are well-formed
- Retry on errors → no crashing when you type invalid JSON
- Smart dependencies → only asks relevant questions
- Flexible outputs: description, component specs, or production-ready code (React, Flutter, Vue, SwiftUI…)
- Saves artifacts:
  - `out/answers.json` → structured config
  - `out/prompt.txt` → final prompt for GPT/API

---

## 🚀 Usage
Run the interactive questionnaire:

```bash
npm run start
