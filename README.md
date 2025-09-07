# Prompt Factory UI 🏗️

An interactive **CLI tool** that helps you generate structured prompts for building **web and mobile UIs**.

Instead of writing long instructions manually, this project asks you the right questions (platforms, design system, screens, flows, etc.), validates your answers, and outputs a polished prompt you can drop into:

- a **Custom GPT**
- or your own **API pipeline**

## 🚀 Quickstart

```bash
# Clone the repository
git clone https://github.com/yourusername/prompt-factory-ui.git
cd prompt-factory-ui

# Install dependencies
npm install

# Run the interactive questionnaire
npm run start
```

## ✨ Features

- **Interactive questionnaire** (Inquirer-based)
- **Schema validation** (Ajv) → ensures answers are well-formed
- **Retry on errors** → no crashing when you type invalid JSON
- **Smart dependencies** → only asks relevant questions
- **Flexible outputs**: description, component specs, or production-ready code (React, Flutter, Vue, SwiftUI…)
- **Saves artifacts**:
  - `out/answers.json` → structured config
  - `out/prompt.txt` → final prompt for GPT/API

## 🛠️ Usage

Run the interactive questionnaire:

```bash
npm run start
```

Follow the prompts (space to toggle options, enter to confirm).

## 📝 Example

Example input for Screens question:

```json
[
  { "name": "Landing/Home", "priority": 1, "mustHave": true },
  {
    "name": "Vehicle List & Filters",
    "priority": 2,
    "mustHave": true,
    "notes": "Sort by price, rating, distance"
  },
  { "name": "Booking Flow", "priority": 3, "mustHave": true }
]
```

Generates a final prompt like:

```
SYSTEM:
You are a senior product designer and front-end engineer. Produce UI that is consistent, accessible, and production-viable.

USER:
Build UI for a project with the following context (JSON follows). Interpret missing values sensibly.

<CONTEXT>
{ ... your JSON answers ... }
</CONTEXT>

TASK:
1) If output.format is "description": ...
2) If output.format is "component-spec": ...
3) If output.format starts with "code-": ...
```

## ⚡ Demo

Run with a sample payload:

```bash
npm run demo
```

Outputs `out/prompt_from_demo.txt`.

## 🛠️ Tech Stack

- **TypeScript**
- **Inquirer** (CLI questions)
- **Ajv** (JSON Schema validation)
- **Chalk** (CLI colors)

## 📂 Project Structure

```
src/
  index.ts          # CLI entry
  schema.json       # JSON Schema for answers
  questionnaire.json# Questions spec
  types.ts          # Types + prompt builder
  promptTemplate.ts # Prompt templates
  io.ts             # File helpers
  demo.ts           # Demo runner

data/examples/
  vehicle-rental.json

out/
  answers.json      # Generated answers
  prompt.txt        # Generated prompt
```

## 🌟 Roadmap

- [ ] Add presets (e.g., React+Tailwind defaults)
- [ ] Web UI (Next.js form + export to prompt)
- [ ] Export as ZIP (answers + prompt + README)
- [ ] Integrate directly with OpenAI API

## 📜 License

MIT License © 2025

## 🙌 Contributing

Pull requests welcome!

If you have ideas for better questions, new output formats, or UX improvements, open an issue or PR.

---

✅ This is the **final, ready-to-go README.md** — just replace your file with this, commit, and push. You won't need to add sections manually anymore.
