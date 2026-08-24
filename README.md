# Sonora — Meeting Intelligence

Sonora turns meeting recordings into clear, readable summaries — decisions,
context, and next steps — without anyone re-listening to the call. Upload an
audio or video file and Sonora transcribes it and generates a structured
summary automatically.

Built with [Next.js](https://nextjs.org) and originally scaffolded with
[v0](https://v0.app).

---

## What it does today

- **Upload** an audio or video recording (up to 250 MB) from the "Overview"
  or "My meetings" view.
- **Transcription** — the file is sent to `openai/gpt-4o-mini-transcribe` via
  the Vercel AI Gateway and converted to plain text.
- **Summary generation** — the transcript is passed to `openai/gpt-4o-mini`
  with a system prompt instructing it to write a faithful, multi-paragraph
  summary (no invented facts, names, dates, decisions, or action items).
- **Workspace UI** — a sidebar-driven dashboard with:
  - **Overview** — stats, the latest meeting's Summary/Transcript tabs, and a
    recent-meetings list with search.
  - **My meetings** — the full meetings list, newest upload first.
  - **Insights** — lightweight aggregate stats (conversation count, top
    topic, decisions-captured rate).
  - **Settings** — a workspace-name field and a notifications toggle.
  - **Shared with me** — placeholder empty state.
- **Notices** — inline status messages during upload ("Uploading…",
  "Transcribing and generating a summary…", success/error states).

### Not yet wired up

The `package.json` includes `drizzle-orm`, `pg`, and `better-auth`, but there
is currently no database schema, migration, or auth flow in the codebase —
meetings live only in React state (`useState`) and are lost on refresh. The
starter "Recent meetings" data, the Action Items tab, and some dashboard
numbers are static/demo content, not derived from real uploads. See
[Suggested next steps](#suggested-next-steps) below.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 + `shadcn` component conventions |
| Icons | lucide-react |
| File storage | Vercel Blob (`@vercel/blob`) |
| Transcription + summary | Vercel AI Gateway (`ai` SDK) — `openai/gpt-4o-mini-transcribe` and `openai/gpt-4o-mini` |
| Analytics | `@vercel/analytics` (production only) |
| Present but unused | `drizzle-orm`, `pg`, `better-auth` |

---

## Project structure

```
app/
  layout.tsx             Root layout, metadata, favicons, Vercel Analytics
  page.tsx               The entire dashboard UI (sidebar, views, upload flow)
  globals.css             Tailwind v4 theme tokens (light/dark CSS variables)
  api/
    upload/route.ts       POST — validates and stores the file in Vercel Blob
    summarize/route.ts    POST — transcribes the file, then summarizes it
components/
  ui/button.tsx           shadcn-style Button component
lib/
  utils.ts                `cn()` class-merging helper
public/                   Favicons and placeholder images
```

`app/page.tsx` is intentionally a single client component that holds all UI
state (active view, active tab, meetings array, search query, upload/notice
state) rather than splitting into many files — convenient for a v0-generated
prototype, worth breaking apart if the project grows.

---

## Getting started

### 1. Install dependencies

```bash
pnpm install
# or
npm install
# or
yarn install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```bash
# Required — used by /api/upload to store the raw recording
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token

# Required — used by /api/summarize for transcription + summary generation
AI_GATEWAY_API_KEY=your_vercel_ai_gateway_key
```

- `BLOB_READ_WRITE_TOKEN` comes from a [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)
  store attached to your project.
- `AI_GATEWAY_API_KEY` comes from the [Vercel AI Gateway](https://vercel.com/docs/ai-gateway).
  It authenticates both the transcription call
  (`https://ai-gateway.vercel.sh/v1/audio/transcriptions`) and the
  `generateText` summary call.

If you deploy on Vercel with Blob and AI Gateway enabled for the project,
these are usually provisioned for you automatically.

### 3. Run the development server

```bash
pnpm dev
# or
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Build for production

```bash
pnpm build
pnpm start
```

---

## How the upload → summary flow works

1. The user picks a file from the hidden `<input type="file">` (accepts
   `audio/*`, `video/*`, or common extensions as a fallback check).
2. The client validates type and size (≤ 250 MB) before doing anything.
3. `POST /api/upload` — the file is streamed to Vercel Blob under
   `meetings/{uuid}-{sanitized-filename}` with private access. Runs on the
   Node.js runtime with a 60s max duration.
4. `POST /api/summarize` — the same file is sent again, this time to the AI
   Gateway's transcription endpoint, then the resulting transcript is sent to
   `generateText` for summarization. Runs on the Node.js runtime with a 300s
   max duration (long recordings need the extra time).
5. On success, a new entry is prepended to the in-memory `meetings` array
   with the real `summary` and `transcript`, the view switches to "My
   meetings", and the new meeting is marked active.
6. Errors at any step (bad file type, oversized file, transcription failure,
   empty transcript, summarization failure) surface as a plain-language
   inline notice — nothing throws an unhandled error to the user.

---

## Design notes

- Theme tokens (light and dark) are defined as CSS custom properties in
  `app/globals.css` using OKLCH color values, mapped into Tailwind via
  `@theme inline`. Dark mode is toggled with a `.dark` class ancestor.
- The layout is a fixed sidebar + scrollable main content area, collapsing
  to an off-canvas drawer (`mobileNav` state) below the `lg` breakpoint.

---

## Suggested next steps

If you pick this project back up, the highest-value gaps to close are:

- **Persistence** — wire up `drizzle-orm` + `pg` (already installed) with a
  `meetings` table (title, date, duration, transcript, summary, status) so
  uploads survive a refresh, and replace the in-memory `starterMeetings`
  array with real queries.
- **Auth** — `better-auth` is installed but not configured; add it if this
  moves beyond a single-user demo, so meetings are scoped per account.
- **Real action items** — the "Action items" tab currently renders static
  demo data (an `actions` array referenced in `page.tsx`); extend the
  summarization prompt to also return structured action items (task, owner,
  due date) and render those instead.
- **Real insights** — the Insights view's numbers are hardcoded; derive them
  from stored meetings once persistence exists.
- **Speaker labels / timestamps** — the transcription call currently
  requests plain `text` output; switching to a verbose/JSON response format
  from the transcription model would unlock per-speaker and timestamped
  transcript rendering.

---

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)
- [Vercel AI Gateway](https://vercel.com/docs/ai-gateway)
- [v0 Documentation](https://v0.app/docs)
