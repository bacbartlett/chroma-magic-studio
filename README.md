# Chroma Magic Studio

A free browser-based chroma key (green screen) tool. Upload an image, pick the color to remove, tweak tolerance and edge smoothing, and export with a transparent or solid background.

**Live app:** [chromakeyfree.com](https://chromakeyfree.com)

## Features

- **Image upload** — Drag and drop or click to load images
- **Color selection** — Eyedropper or manual RGB picker for the color to remove
- **Adjustable settings** — Tolerance and edge smoothing for cleaner edges
- **Fill modes** — Transparent background or a custom replacement color
- **Export** — Download the result as PNG (with transparency) or JPEG

## Tech stack

- **Vite** — Build and dev server
- **React 18** — UI
- **TypeScript** — Typing
- **Tailwind CSS** — Styling
- **shadcn/ui** — UI components (Radix + Tailwind)
- **Vitest** — Tests

## Local development

Requires **Node.js** and **npm** (or [Bun](https://bun.sh) — `bun.lockb` is present).

```sh
# Clone the repo
git clone <YOUR_GIT_URL>
cd chroma-magic-studio

# Install dependencies
npm install

# Start dev server
npm run dev
```

Then open the URL shown in the terminal (usually `http://localhost:5173`).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest once |
| `npm run test:watch` | Run Vitest in watch mode |

## Project structure

- `src/components/` — Main UI: `ChromaKeyApp`, `ImageUploader`, `ColorSelector`, `ControlsPanel`, `PreviewCanvas`, `ExportButton`
- `src/lib/chromaKey.ts` — Chroma key processing logic
- `src/pages/` — Route pages (Index, NotFound)

## License

Private — see repository settings.
