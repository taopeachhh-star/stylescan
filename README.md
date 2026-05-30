# StyleScan

> **Screenshot → Figma Design Tokens** — built for designers, not developers

Upload any UI screenshot and get structured design tokens (colors, typography, spacing, border radius) with **AI confidence ratings**, ready to import directly into Figma Variables via Tokens Studio.

## Why StyleScan?

Existing tools like Peel and Superposition output CSS/Tailwind/DESIGN.md — built for AI coding workflows. StyleScan is different:

- **Output goes to designers, not code** — W3C Design Token `.json` that imports directly into Figma Variables
- **Honest about AI limitations** — every value has a confidence level (high / medium / low), not fake precision
- **Fully editable before export** — AI gives a starting draft; you make the final call

## Quick Start

```bash
git clone https://github.com/yourusername/stylescan.git
cd stylescan
npm install
cp .env.example .env.local
# Add your Anthropic API key to .env.local
npm run dev
```

Open http://localhost:3000

## How it works

```
Upload screenshot
      ↓
Claude claude-opus-4-5 (multimodal) analyzes the image
      ↓
Structured JSON with confidence annotations
      ↓
Preview + edit any values inline
      ↓
Export W3C Design Token .json
      ↓
Import into Figma via Tokens Studio plugin
```

## Confidence Levels

| Level | Meaning | Typical tokens |
|-------|---------|----------------|
| ✓ High | Direct visual evidence | Colors (hex) |
| ~ Medium | Reasonable inference | Font sizes, radius |
| ? Low | Guess — verify manually | Spacing grid |

## Importing into Figma

1. Export `.json` from StyleScan
2. Figma → Plugins → **Tokens Studio** (free)
3. File Storage → Load from file
4. Apply to your document

## Tech Stack

- Next.js 14 + TypeScript
- Tailwind CSS
- Claude claude-opus-4-5 (Anthropic API)
- W3C Design Token format

## Deploy

Add `ANTHROPIC_API_KEY` as environment variable, then:

```bash
npm run build && npm start
```

Or deploy to Vercel with one click — add `ANTHROPIC_API_KEY` in project settings.

## License

MIT
