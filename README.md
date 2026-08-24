# SLO Tracker — Web (Next.js, ready for Vercel)

A full web port of the "SLO Tracker" app — same architecture as the React
Native build, rebuilt with **Next.js 16 (App Router) + Tailwind CSS +
lucide-react**, storing data in the browser's `localStorage`. Zero
external services, so it deploys to Vercel with no environment variables
or backend setup.

This has been **verified with a real `next build`** (Next.js 16.3.1,
Turbopack) — it compiles cleanly with no errors.

## 1. Install

```bash
npm install
```

## 2. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 3. Deploy to Vercel

**Option A — CLI**

```bash
npm i -g vercel
vercel
```

Follow the prompts (link/create a project, accept the detected Next.js
framework preset). Then `vercel --prod` to ship it.

**Option B — Git + Dashboard**

1. Push this folder to a GitHub/GitLab/Bitbucket repo.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. Vercel auto-detects Next.js — no config needed. Click **Deploy**.

No `vercel.json`, environment variables, or serverless functions are
required — this is a fully static-friendly client app.

## Project structure

```
app/
  layout.js         Root layout — imports globals.css, sets metadata
  page.js            Renders the client AppShell
  globals.css        Tailwind + CSS custom properties for role/dark theming
src/
  utils/helpers.js    uid, date formatting, color hashing
  state/
    seedData.js         Initial demo data
    storage.js           localStorage read/write helpers (SSR-safe)
    AppContext.jsx        ALL app state + CRUD + analytics
  context/
    ThemeContext.jsx      Applies data-role / data-theme attrs (drives globals.css vars)
    ToastContext.jsx       Success/error toast banners
    NotificationsContext.jsx  Bell-icon notification modal
  components/          Card, buttons, inputs, modals, lists…
    charts/              DonutChart, BarChart, TrendChart, LineChart, ThreadLine (inline SVG)
  navigation/
    AppShell.jsx          Login/app switch, role tab bar, and a small push-navigation
                           stack for Setup / Missed SLOs / Daily Log (no react-router needed)
  screens/
    LoginScreen.jsx
    teacher/  parent/  admin/  shared/
```

## How theming works

Instead of a JS theme object, colors are CSS custom properties defined in
`app/globals.css`:

```css
[data-role='teacher'] { --role: #6d3fd6; --role-dark: #4c1fa8; --role-bg: #f2edfc; }
[data-theme='dark']   { --bg: #12141c; --paper: #1b1e29; /* … */ }
```

`ThemeContext` just toggles `data-role` and `data-theme` on a wrapper
`<div>`; every component references the variables directly, e.g.
`className="bg-[var(--paper)] text-[var(--ink)]"`. Switching role or dark
mode re-colors the whole app instantly with no re-render of styles.

## How navigation works

There's no file-based routing for the in-app screens — like the original
HTML demo, this is a single-page app. `AppShell.jsx` holds a tiny
`NavContext` (`useNav()`) with `navigate(name, params)` and `goBack()`:
navigating to a tab name switches the bottom tab; navigating to `Setup`,
`Missed`, or `DailyLog` pushes a full-screen overlay with a back button.
This keeps the mobile-app feel and avoids needing a router for what is
essentially a handful of app "screens," not public pages.

## What's implemented

Same feature set as the React Native version: Login with role/session
resume, Teacher (dashboard, Feed SLOs / Today's Coverage, Attendance,
Reports), Parent (dashboard with child switcher, Attendance, Progress,
SLOs feed), Admin (dashboard with donut/bar/trend charts, SLOs overview,
Teacher management, per-student Reports), and shared Setup (cascade-delete
warnings), Daily Activity Log, Missed SLOs, dark mode, and JSON
backup/export via the Web Share API (falls back to clipboard copy).

## Notes

- All 46 source files were syntax-checked, all imports (including `@/`
  aliases) were verified to resolve, all `lucide-react` icon names were
  checked against the installed package, and the project was **actually
  built** with `next build` before being handed to you.
- Date fields use the native `<input type="date">` — no extra dependency
  needed (unlike the RN version, which had to build a custom date field).
- There's no backend and no database — everything lives in the visitor's
  own browser `localStorage`. If you want multi-device sync, you'd add a
  database (e.g. Vercel Postgres/KV) and API routes; `AppContext.jsx`'s
  `exportSnapshot()` / `restoreSnapshot()` are natural hooks for that.
