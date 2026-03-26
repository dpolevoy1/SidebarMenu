# A.Team Assemble — Sidebar demo

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

### Accessibility & input

- **⌘S** — Toggles collapse / expand from rail, pins when in hover-peek (same idea as the primary sidebar control).
- **⌘Q** — Activates **New question** (`new-question` nav), when that shortcut is not disabled via props (`newQuestionShortcut={null}` hides badge and shortcut).
- **⌘S** / **⌘Q** are suppressed while focus is in editable fields (`input`, `textarea`, `select`, `contenteditable`).
- Tooltips on collapsed items are **pointer-hover only** (no focus-only floating tooltip) to match product behavior; controls still expose **`aria-label`** / **`aria-keyshortcuts`** where set.

### UI stack

- **React 19**, **TypeScript**, **Vite 6**
- **Tailwind CSS v4** (via `@tailwindcss/vite`), plus **tailwind-animations**
- **Hugeicons** (`@hugeicons/react`, `@hugeicons/core-free-icons`)
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
| `src/components/SidebarMenu/` | Sidebar UI, collapse/peek logic, keyboard shortcuts, CSS module |
| `src/components/Tooltip/` | Shared tooltip (cursor-anchored, hover-only) |
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
