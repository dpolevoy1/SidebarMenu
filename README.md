# A.Team Assemble — Sidebar menu

Vite + React + TypeScript demo app built around a production-style **sidebar navigation** (`SidebarMenu`): collapsible rail, hover “peek,” Starred/Recents chats, expandable sections, and design-system-aligned tooltips.

**Remote:** [github.com/dpolevoy1/SidebarMenu](https://github.com/dpolevoy1/SidebarMenu)

---

## Features

### Layout & collapse

- **Expanded width** (~300px) with org headline, user block, and full labels.
- **Collapsed rail** (~68px): icon-first nav; section titles and nav chevrons/labels hide per CSS.
- **Hover peek:** While collapsed, hovering the **menu** or the **logo** temporarily expands the sidebar to full width (parent still treats it as “collapsed” until you pin).
- **Pin:** Use the header control during peek, **click the logo hit-area**, **⌘S**, or empty rail/menu click behavior (see app wiring) to keep the sidebar fully expanded.
- **Header collapse/Pin** uses contextual icons (e.g. open panel, pin) and tooltips (“Collapse sidebar,” “Pin sidebar”) with **⌘S** where applicable.

### Navigation & content

- **Actions:** New question, Chief of Staff (expandable sub-nav), Reports, Post meeting insights.
- **Intelligence:** Knowledge, Controls, Wisdom — each can expose an expandable sub-list with staggered open/close motion.
- **Starred & Recents:** Chats are modeled as `{ id, title }` (`SidebarChatItem`). Starred is a **filtered subset** of recents by id (`starredChatIds`), order follows recents. Rows support star/unstar and selection by **chat id**.

### Sidebar Lottie icons

Several nav rows use **Lottie** (Bodymovin JSON in `public/animations/`) via **`lottie-react`**, instead of static Hugeicons:

- **Rest pose:** last frame of each animation (no autoplay loop).
- **Hover:** pointer over the **whole row** plays from frame 0 once; leaving snaps back to rest.
- **Speed:** playback is slightly faster than authored (~`1.35×`) for snappier feedback.
- **Active row:** stroked paths follow **`currentColor`** like text (`--color-primary-600` when selected) without breaking mattes.
- **Fallback:** if JSON fails to fetch, the prior Hugeicons glyph for that row is shown.

| JSON asset | Nav item |
|------------|----------|
| `anima_cos.json` | Chief of Staff |
| `anima_knowledge.json` | Knowledge |
| `anima_controls.json` | Controls |
| `anima_reports.json` | Reports |
| `anima_insights.json` | Post meeting insights |
| `anima_wisdom.json` | Wisdom |

Other JSON files in `public/animations/` may exist for future UI (they are not all wired in code yet).

### Accessibility & input

- **⌘S** — Toggles collapse / expand from rail, pins when in hover-peek (same idea as the primary sidebar control).
- **⌘Q** — Activates **New question** (`new-question` nav), when that shortcut is not disabled via props (`newQuestionShortcut={null}` hides badge and shortcut).
- **⌘S** / **⌘Q** are suppressed while focus is in editable fields (`input`, `textarea`, `select`, `contenteditable`).
- Tooltips on collapsed items are **pointer-hover only** (no focus-only floating tooltip) to match product behavior; controls still expose **`aria-label`** / **`aria-keyshortcuts`** where set.

### UI stack

- **React 19**, **TypeScript**, **Vite 6**
- **Tailwind CSS v4** (via `@tailwindcss/vite`), plus **tailwind-animations**
- **Hugeicons** (`@hugeicons/react`, `@hugeicons/core-free-icons`) — fallbacks and non-Lottie UI
- **Lottie** (`lottie-react`) — animated sidebar nav icons
- Optional **Agentation** dev integration in `App` (endpoint configurable)

---

## Getting started

```bash
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`).

```bash
npm run build    # tsc --noEmit && vite build
npm run preview  # serve production build locally
```

---

## Project layout (high level)

| Path | Purpose |
|------|---------|
| `src/App.tsx` | Demo shell: sidebar collapse state, chat/starred ids, nav selection, `Agentation` mount |
| `src/components/SidebarMenu/` | Sidebar UI, collapse/peek logic, keyboard shortcuts, Lottie icons, CSS module |
| `src/components/Tooltip/` | Shared tooltip (cursor-anchored, hover-only) |
| `public/animations/` | Lottie JSON assets served at `/animations/*.json` |
| `src/index.css` | Global / Tailwind entry |

Public API for the sidebar is exported from `src/components/SidebarMenu/index.ts` (`SidebarMenu`, defaults, `SidebarMenuProps`, `SidebarNavId`, `SidebarChatItem`).

---

## Customizing

- Pass **`starredChatIds`**, **`recentChats`**, **`selectedChat`**, **`onChatClick`**, **`onToggleRecentStar`**, **`onRemoveStarredChat`** to drive chat lists from your app.
- **`onToggleCollapse`** + **`sidebarCollapsed`** control pinned expanded vs rail.
- **`newQuestionShortcut`**: override label text, or `null` to hide the shortcut badge and disable **⌘Q** handling from the menu component.

---

## License

Private / internal demo — see repository settings on GitHub.
