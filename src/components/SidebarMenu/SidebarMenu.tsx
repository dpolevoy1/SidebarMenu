import { useEffect, useMemo, useRef, useState } from "react";
import type { FocusEvent, MouseEvent, ReactNode } from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  BookBookmark02Icon,
  Brain03Icon,
  DocumentAttachmentIcon,
  FileViewIcon,
  LocationUser03Icon,
  PanelLeftOpenIcon,
  PinIcon,
  PlusSignIcon,
  Settings04Icon,
  StarIcon,
} from "@hugeicons/core-free-icons";
import { Tooltip } from "../Tooltip";
import styles from "./SidebarMenu.module.css";

const DEFAULT_LOGO =
  "https://www.figma.com/api/mcp/asset/6495e079-37c2-4aab-bb93-875b65fe45c8";

/**
 * After closing an expandable sub-list, we wait until its max-height + staggered row fade
 * finish before firing `onNavClick` / opening the next list. Delay is derived from that list’s
 * item count — a fixed ~1s wait was excessive for the default 2–4 row lists.
 */
const SUB_NAV_CLOSE_BUFFER_MS = 48;

/** Starred / Recents row control — icon 14×14 inside 20×20 hit target (see `.chatStarBtn` in CSS). */
const CHAT_STAR_ICON_PX = 14;

/** Delay before closing hover-peek so brief pointer gaps / tooltip paths do not flicker the rail. */
const COLLAPSED_PEEK_LEAVE_MS = 180;

/** Collapse, expand (rail), or pin (hover-peek) — all use ⌘S. */
const SIDEBAR_TOGGLE_ARIA_KEYSHORTCUTS = "Meta+S";
const SIDEBAR_TOGGLE_SHORTCUT_DISPLAY = "⌘S";

const NEW_QUESTION_SHORTCUT_DISPLAY_DEFAULT = "⌘Q";
const NEW_QUESTION_SHORTCUT_ARIA = "Meta+Q";

function isTextEditingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return target.isContentEditable;
}

/** Default sub-nav labels — keep in sync with `SidebarMenu` prop defaults; App uses `[0]` as initial selection. */
export const DEFAULT_CHIEF_OF_STAFF_ITEMS = [
  "Briefing",
  "Activity",
  "Trends",
];
export const DEFAULT_KNOWLEDGE_ITEMS = [
  "Data sources",
  "Context & Goals",
  "Automations",
  "Dimensions & Labels",
];
export const DEFAULT_CONTROLS_ITEMS = ["Control room", "Metric validation"];
export const DEFAULT_WISDOM_ITEMS = [
  "Agents",
  "Learnings",
  "Past actions",
  "Narratives",
];

export type SidebarNavId =
  | "new-question"
  | "chief-of-staff"
  | "reports"
  | "post-meeting-insights"
  | "knowledge"
  | "controls"
  | "wisdom";

/** Stable chat row identity; `title` is display-only and may duplicate across rows. */
export type SidebarChatItem = { id: string; title: string };

export interface SidebarMenuProps {
  organizationName: string;
  userName: string;
  logoSrc?: string;
  activeNavId?: SidebarNavId;
  /** Highlights a Starred / Recents row when set (`chatId` is stable; `section` disambiguates same id if ever reused). */
  selectedChat?: {
    section: "starred" | "recents";
    chatId: string;
  } | null;
  /**
   * Shortcut shown on the right of "New question" on hover/focus (inline in the row).
   * Defaults to "⌘Q". Pass `null` to hide it and omit `aria-keyshortcuts` on that control.
   */
  newQuestionShortcut?: string | null;
  onNavClick?: (id: SidebarNavId) => void;
  onToggleCollapse?: () => void;
  /** When true, sidebar is collapsed; collapse button shows "Open sidebar" tooltip. */
  sidebarCollapsed?: boolean;
  /**
   * Chat ids (subset of `recentChats`) that are starred. Starred list order follows this array
   * (newly starred / opened-from-recents ids are typically prepended by the parent).
   */
  starredChatIds?: string[];
  /** Full chat list; Starred is always a filtered subset by `starredChatIds`. */
  recentChats?: SidebarChatItem[];
  onChatClick?: (
    chat: SidebarChatItem,
    section: "starred" | "recents",
    index: number,
  ) => void;
  /** Remove a chat from Starred (star control). */
  onRemoveStarredChat?: (chatId: string) => void;
  /**
   * Toggle Starred from a Recents row: gray star adds the chat to Starred (orange);
   * orange star removes it from Starred and returns the Recents star to gray.
   */
  onToggleRecentStar?: (chatId: string) => void;
  /** Initial open state for Starred chat list. Default: true. */
  defaultStarredOpen?: boolean;
  /** Initial open state for Recents chat list. Default: true. */
  defaultRecentsOpen?: boolean;
  /**
   * When "Chief of Staff" is the active nav item, these rows show below it (indented, no star).
   * Default: Briefing, Activity, Trends (Figma Actions / Chief of Staff expanded).
   */
  chiefOfStaffItems?: string[];
  /** Highlights a Chief of Staff sub-row when set (must match an entry in `chiefOfStaffItems`). */
  selectedChiefOfStaffItem?: string | null;
  onChiefOfStaffItemClick?: (title: string, index: number) => void;
  /**
   * When "Knowledge" is the active nav item, these rows show below it (same pattern as Chief of Staff).
   */
  knowledgeItems?: string[];
  selectedKnowledgeItem?: string | null;
  onKnowledgeItemClick?: (title: string, index: number) => void;
  controlsItems?: string[];
  selectedControlsItem?: string | null;
  onControlsItemClick?: (title: string, index: number) => void;
  wisdomItems?: string[];
  selectedWisdomItem?: string | null;
  onWisdomItemClick?: (title: string, index: number) => void;
}

function NavIcon({
  icon,
  size = 20,
}: {
  icon: IconSvgElement;
  size?: number;
}) {
  return (
    <span className={styles.navIcon}>
      <HugeiconsIcon
        icon={icon}
        size={size}
        strokeWidth={1.75}
        color="currentColor"
        aria-hidden
      />
    </span>
  );
}

function NavHoverChevron() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={16}
      height={16}
      viewBox="0 0 16 16"
      fill="none"
    >
      <path
        d="M4 6L8 10L12 6"
        stroke="currentColor"
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Double chevron next to workspace name (design system — Secondary-700 stroke). */
function WorkspaceSwitcherChevron() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={16}
      height={16}
      viewBox="0 0 16 16"
      fill="none"
    >
      <path
        d="M4.6665 10L7.99984 13.3333L11.3332 10"
        stroke="currentColor"
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.6665 6.00002L7.99984 2.66669L11.3332 6.00002"
        stroke="currentColor"
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NewQuestionIcon() {
  return (
    <span className={styles.newQuestionIcon} aria-hidden>
      <span className={styles.newQuestionBg} />
      <HugeiconsIcon
        className={styles.newQuestionPlus}
        icon={PlusSignIcon}
        size={12}
        strokeWidth={2}
        color="var(--color-neutral-white)"
        aria-hidden
      />
    </span>
  );
}

/** Matches `.chatRow` sub-nav row height in `SidebarMenu.module.css`. */
const SUB_NAV_ROW_HEIGHT_PX = 38;
/** Target expansion speed (px/s); duration = content height / this, clamped. */
const SUB_NAV_PX_PER_SEC = 420;
const SUB_NAV_DURATION_MIN_MS = 340;
const SUB_NAV_DURATION_MAX_MS = 680;

function subNavOpenDurationMs(itemCount: number): number {
  if (itemCount <= 0) return SUB_NAV_DURATION_MIN_MS;
  const contentPx = itemCount * SUB_NAV_ROW_HEIGHT_PX;
  const ms = (contentPx / SUB_NAV_PX_PER_SEC) * 1000;
  return Math.round(
    Math.min(
      SUB_NAV_DURATION_MAX_MS,
      Math.max(SUB_NAV_DURATION_MIN_MS, ms),
    ),
  );
}

function subNavStaggerStepMs(itemCount: number, durationMs: number): number {
  if (itemCount <= 1) return 0;
  return Math.min(
    34,
    Math.max(10, Math.floor(durationMs / (2 * (itemCount - 1)))),
  );
}

/** Matches close timing: panel max-height runs alongside row opacity; slowest row = (n-1)*stagger + duration. */
function subNavCloseDelayMs(itemCount: number): number {
  if (itemCount <= 0)
    return SUB_NAV_DURATION_MIN_MS + SUB_NAV_CLOSE_BUFFER_MS;
  const durationMs = subNavOpenDurationMs(itemCount);
  const staggerStepMs = subNavStaggerStepMs(itemCount, durationMs);
  const staggerTailMs =
    itemCount > 1 ? (itemCount - 1) * staggerStepMs : 0;
  return durationMs + staggerTailMs + SUB_NAV_CLOSE_BUFFER_MS;
}

type ExpandableSubNavListProps = {
  items: string[];
  ariaLabel: string;
  expanded: boolean;
  selectedTitle: string | null;
  onItemClick?: (title: string, index: number) => void;
  keyPrefix: string;
};

function ExpandableSubNavList({
  items,
  ariaLabel,
  expanded,
  selectedTitle,
  onItemClick,
  keyPrefix,
}: ExpandableSubNavListProps) {
  const openDurationMs = subNavOpenDurationMs(items.length);
  const staggerStepMs = subNavStaggerStepMs(items.length, openDurationMs);
  const contentHeightPx = items.length * SUB_NAV_ROW_HEIGHT_PX;

  return (
    <div
      className={`${styles.sidebarSubNavList} ${
        expanded ? styles.sidebarSubNavListExpanded : ""
      }`}
      style={
        {
          "--n": items.length,
          "--sub-nav-max": `${contentHeightPx}px`,
          "--sub-nav-duration": `${openDurationMs}ms`,
          "--stagger-step": `${staggerStepMs}ms`,
        } as React.CSSProperties
      }
      role="group"
      aria-label={ariaLabel}
      aria-hidden={!expanded}
      {...(!expanded ? { inert: true as const } : {})}
    >
      {items.map((title, index) => (
        <button
          key={`${keyPrefix}-${index}-${title}`}
          type="button"
          style={{ "--stagger": index } as React.CSSProperties}
          className={`${styles.chatRow} ${styles.sidebarSubNavRow} ${styles.sidebarSubNavRowFade} ${
            selectedTitle === title ? styles.chatRowSelected : ""
          }`}
          onClick={() => onItemClick?.(title, index)}
        >
          <span className={styles.chatLabel}>{title}</span>
        </button>
      ))}
    </div>
  );
}

export function SidebarMenu({
  organizationName,
  userName,
  logoSrc = DEFAULT_LOGO,
  activeNavId = "post-meeting-insights",
  selectedChat = null,
  newQuestionShortcut,
  onNavClick,
  onToggleCollapse,
  sidebarCollapsed = false,
  starredChatIds = [
    "chat-assemble-demo",
    "chat-crm-mau",
    "chat-dove-daily",
  ],
  recentChats = [
    { id: "chat-assemble-demo", title: "Assemble Demo generation" },
    { id: "chat-abi-unilever", title: "ABI x Unilever" },
    {
      id: "chat-assemble-projects-doc",
      title: "Assemble Projects Documentation 2026",
    },
    { id: "chat-astrazeneca", title: "AstraZeneca account summary" },
    { id: "chat-revlon", title: "Revlon AI workflow transformation" },
    {
      id: "chat-beta-2-unilever-sop",
      title: "[beta.2] Unilever S&OP analytics report",
    },
    {
      id: "chat-beta-1-unilever-sop",
      title: "[beta.1] Unilever S&OP analytics report",
    },
    { id: "chat-crm-mau", title: "CRM/Marketing automation spend per MAU" },
    { id: "chat-klaviyo-mau", title: "Klaviyo vs Braze MAU comparison" },
    { id: "chat-dove-daily", title: "Daily insights for Dove skincare brand" },
  ],
  onChatClick,
  onRemoveStarredChat,
  onToggleRecentStar,
  defaultStarredOpen = true,
  defaultRecentsOpen = true,
  chiefOfStaffItems = DEFAULT_CHIEF_OF_STAFF_ITEMS,
  selectedChiefOfStaffItem = null,
  onChiefOfStaffItemClick,
  knowledgeItems = DEFAULT_KNOWLEDGE_ITEMS,
  selectedKnowledgeItem = null,
  onKnowledgeItemClick,
  controlsItems = DEFAULT_CONTROLS_ITEMS,
  selectedControlsItem = null,
  onControlsItemClick,
  wisdomItems = DEFAULT_WISDOM_ITEMS,
  selectedWisdomItem = null,
  onWisdomItemClick,
}: SidebarMenuProps) {
  const [starredOpen, setStarredOpen] = useState(defaultStarredOpen);
  const [recentsOpen, setRecentsOpen] = useState(defaultRecentsOpen);
  /** Sub-list under Chief of Staff; opens on first nav to this item; second click toggles. */
  const [chiefOfStaffListOpen, setChiefOfStaffListOpen] = useState(false);
  /** Sub-list under Knowledge — same behavior as Chief of Staff. */
  const [knowledgeListOpen, setKnowledgeListOpen] = useState(false);
  const [controlsListOpen, setControlsListOpen] = useState(false);
  const [wisdomListOpen, setWisdomListOpen] = useState(false);
  const pendingNavTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const menuScrollRef = useRef<HTMLElement>(null);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  /**
   * Parent still has `sidebarCollapsed === true`, but pointer is over the menu `<nav>` or the collapsed
   * logo — show full-width peek. Clicking the logo hit-area / empty menu pins via `onToggleCollapse`.
   */
  const [collapsedHoverPeek, setCollapsedHoverPeek] = useState(false);
  const peekLeaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPeekLeaveTimer = () => {
    if (peekLeaveTimerRef.current !== null) {
      window.clearTimeout(peekLeaveTimerRef.current);
      peekLeaveTimerRef.current = null;
    }
  };

  const isCollapsedRail = sidebarCollapsed && !collapsedHoverPeek;

  const starredIdSet = useMemo(() => new Set(starredChatIds), [starredChatIds]);
  /** Starred rows only: order matches `starredChatIds` (not Recents order). */
  const starredChatsOrdered = useMemo(() => {
    const byId = new Map(recentChats.map((c) => [c.id, c]));
    return starredChatIds
      .map((id) => byId.get(id))
      .filter((c): c is SidebarChatItem => c != null);
  }, [recentChats, starredChatIds]);

  const clearPendingNavTimeout = () => {
    if (pendingNavTimeoutRef.current !== null) {
      clearTimeout(pendingNavTimeoutRef.current);
      pendingNavTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    const el = menuScrollRef.current;
    if (!el) return;
    const sync = () => setHeaderScrolled(el.scrollTop > 0);
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", sync);
      ro.disconnect();
    };
  }, [sidebarCollapsed, collapsedHoverPeek]);

  useEffect(() => {
    if (!sidebarCollapsed) {
      clearPeekLeaveTimer();
      setCollapsedHoverPeek(false);
    }
  }, [sidebarCollapsed]);

  useEffect(() => () => clearPeekLeaveTimer(), []);

  const activeExpandableSubListIsOpen = (): boolean => {
    switch (activeNavId) {
      case "chief-of-staff":
        return chiefOfStaffListOpen;
      case "knowledge":
        return knowledgeListOpen;
      case "controls":
        return controlsListOpen;
      case "wisdom":
        return wisdomListOpen;
      default:
        return false;
    }
  };

  const closeActiveExpandableSubList = () => {
    switch (activeNavId) {
      case "chief-of-staff":
        setChiefOfStaffListOpen(false);
        break;
      case "knowledge":
        setKnowledgeListOpen(false);
        break;
      case "controls":
        setControlsListOpen(false);
        break;
      case "wisdom":
        setWisdomListOpen(false);
        break;
      default:
        break;
    }
  };

  const expandableItemCountForNav = (id: SidebarNavId): number => {
    switch (id) {
      case "chief-of-staff":
        return chiefOfStaffItems.length;
      case "knowledge":
        return knowledgeItems.length;
      case "controls":
        return controlsItems.length;
      case "wisdom":
        return wisdomItems.length;
      default:
        return 1;
    }
  };

  const openExpandableSubListForId = (id: SidebarNavId) => {
    if (id === "chief-of-staff") setChiefOfStaffListOpen(true);
    else if (id === "knowledge") setKnowledgeListOpen(true);
    else if (id === "controls") setControlsListOpen(true);
    else if (id === "wisdom") setWisdomListOpen(true);
  };

  const completeExpandableNavigation = (id: SidebarNavId) => {
    onNavClick?.(id);
    openExpandableSubListForId(id);
  };

  /** Non-expandable nav rows: delay `onNavClick` if an expandable sub-list is open. */
  const schedulePlainNavClick = (id: SidebarNavId) => {
    clearPendingNavTimeout();
    if (activeExpandableSubListIsOpen()) {
      closeActiveExpandableSubList();
      const waitMs = subNavCloseDelayMs(
        expandableItemCountForNav(activeNavId),
      );
      pendingNavTimeoutRef.current = setTimeout(() => {
        pendingNavTimeoutRef.current = null;
        onNavClick?.(id);
      }, waitMs);
    } else {
      onNavClick?.(id);
    }
  };

  useEffect(() => {
    const onDocKeyDown = (e: KeyboardEvent) => {
      if (isTextEditingTarget(e.target)) return;
      if (!e.metaKey || e.altKey) return;

      if (e.code === "KeyS" && !e.shiftKey && !e.repeat) {
        e.preventDefault();
        onToggleCollapse?.();
        return;
      }

      if (
        e.code === "KeyQ" &&
        !e.shiftKey &&
        !e.repeat &&
        newQuestionShortcut !== null
      ) {
        e.preventDefault();
        schedulePlainNavClick("new-question");
      }
    };

    document.addEventListener("keydown", onDocKeyDown);
    return () => document.removeEventListener("keydown", onDocKeyDown);
  }, [newQuestionShortcut, onToggleCollapse, schedulePlainNavClick]);

  /**
   * Expandable nav: toggle when already active; otherwise navigate after closing any open sub-list.
   */
  const handleExpandableNavClick = (id: SidebarNavId) => {
    clearPendingNavTimeout();

    if (activeNavId === id) {
      if (id === "chief-of-staff") {
        setChiefOfStaffListOpen((open) => !open);
      } else if (id === "knowledge") {
        setKnowledgeListOpen((open) => !open);
      } else if (id === "controls") {
        setControlsListOpen((open) => !open);
      } else if (id === "wisdom") {
        setWisdomListOpen((open) => !open);
      }
      onNavClick?.(id);
      return;
    }

    if (activeExpandableSubListIsOpen()) {
      closeActiveExpandableSubList();
      const waitMs = subNavCloseDelayMs(
        expandableItemCountForNav(activeNavId),
      );
      pendingNavTimeoutRef.current = setTimeout(() => {
        pendingNavTimeoutRef.current = null;
        completeExpandableNavigation(id);
      }, waitMs);
    } else {
      completeExpandableNavigation(id);
    }
  };

  useEffect(() => {
    return () => {
      clearPendingNavTimeout();
    };
  }, []);

  useEffect(() => {
    if (sidebarCollapsed && !collapsedHoverPeek) {
      clearPendingNavTimeout();
      setChiefOfStaffListOpen(false);
      setKnowledgeListOpen(false);
      setControlsListOpen(false);
      setWisdomListOpen(false);
    }
  }, [sidebarCollapsed, collapsedHoverPeek]);

  useEffect(() => {
    if (activeNavId !== "chief-of-staff") {
      setChiefOfStaffListOpen(false);
    }
    if (activeNavId !== "knowledge") {
      setKnowledgeListOpen(false);
    }
    if (activeNavId !== "controls") {
      setControlsListOpen(false);
    }
    if (activeNavId !== "wisdom") {
      setWisdomListOpen(false);
    }
  }, [activeNavId]);

  const newQuestionShortcutBadge =
    newQuestionShortcut === null
      ? undefined
      : (newQuestionShortcut ?? NEW_QUESTION_SHORTCUT_DISPLAY_DEFAULT);

  /** One primary selection in the menu; when a Starred/Recents chat is selected, nav + sub-nav must not show active styling. */
  const menuSelectionSuppressedByChat = selectedChat != null;
  const navRowIsActive = (id: SidebarNavId) =>
    !menuSelectionSuppressedByChat && activeNavId === id;

  /** Header collapse control: full width uses Collapse; hover-peek (PinIcon) uses pin copy. */
  const collapseHeaderActionLabel = !sidebarCollapsed
    ? "Collapse sidebar"
    : "Pin sidebar";

  const collapseHeaderShortcutDisplay = SIDEBAR_TOGGLE_SHORTCUT_DISPLAY;
  const collapseHeaderAriaKeyShortcuts = SIDEBAR_TOGGLE_ARIA_KEYSHORTCUTS;

  /** Collapse control in header (hidden on narrow rail; shown when expanded or hover-peek). */
  const collapseHeaderIcon =
    !sidebarCollapsed ? PanelLeftOpenIcon : PinIcon;

  const openMenuPeek = () => {
    if (!sidebarCollapsed) return;
    clearPeekLeaveTimer();
    setCollapsedHoverPeek(true);
  };

  const scheduleMenuPeekClose = () => {
    if (!sidebarCollapsed) return;
    clearPeekLeaveTimer();
    peekLeaveTimerRef.current = window.setTimeout(() => {
      peekLeaveTimerRef.current = null;
      setCollapsedHoverPeek(false);
    }, COLLAPSED_PEEK_LEAVE_MS);
  };

  /** Open peek when pointer enters `<nav>`; collapsed logo uses `openMenuPeek()` the same way. */
  const onMenuPeekMouseEnter = () => openMenuPeek();

  /**
   * Cancel a pending peek close when the pointer re-enters the sidebar (e.g. after a brief gap).
   * Does not open peek by itself (logo / `<nav>` call `openMenuPeek`).
   */
  const onSidebarPeekMouseEnter = () => {
    if (!sidebarCollapsed) return;
    clearPeekLeaveTimer();
  };

  /** Close peek only when the pointer leaves the whole `<aside>`, not when moving nav ↔ header. */
  const onSidebarPeekMouseLeave = (e: MouseEvent<HTMLElement>) => {
    if (!sidebarCollapsed) return;
    const next = e.relatedTarget;
    if (next instanceof Node && e.currentTarget.contains(next)) return;
    scheduleMenuPeekClose();
  };

  /** Keyboard / focus parity: peek stays while focus moves within the full sidebar (nav + header). */
  const onSidebarPeekFocusIn = () => {
    if (!sidebarCollapsed) return;
    openMenuPeek();
  };

  /**
   * Peek closes when focus truly leaves the sidebar. Defer so React/DOM can settle.
   * If focus drops to `body` after a control unmounts (e.g. remove from Starred) or after
   * an intentional `blur()`, keep peek open while the pointer is still over the sidebar.
   */
  const onSidebarPeekFocusOut = (e: FocusEvent<HTMLElement>) => {
    if (!sidebarCollapsed) return;
    const next = e.relatedTarget;
    if (next instanceof Node && e.currentTarget.contains(next)) return;
    const asideEl = e.currentTarget;
    window.setTimeout(() => {
      if (asideEl.contains(document.activeElement)) return;
      if (asideEl.matches(":hover")) return;
      scheduleMenuPeekClose();
    }, 0);
  };

  const wrapCollapsedNavLabel = (label: string, node: ReactNode) => {
    if (!isCollapsedRail) return node;
    return (
      <Tooltip
        label={label}
        wrapperClassName={styles.collapsedNavTooltipWrap}
      >
        {node}
      </Tooltip>
    );
  };

  /** Collapsed rail: empty menu padding / gap / below icons opens sidebar (same as logo control). */
  const handleCollapsedMenuClick = (e: MouseEvent<HTMLElement>) => {
    if (!sidebarCollapsed) return;
    const raw = e.target;
    const el =
      raw instanceof Element
        ? raw
        : raw instanceof Text && raw.parentElement
          ? raw.parentElement
          : null;
    if (!el) return;
    if (el.closest("button, a[href], input, textarea, select")) return;
    onToggleCollapse?.();
  };

  type NavButtonOptions = {
    /** Shortcut text on the right; fades in on row hover/focus (not a floating tooltip). */
    hoverShortcut?: string;
    /** `aria-keyshortcuts` when `hoverShortcut` is set (e.g. "Meta+Q"). */
    hoverShortcutAria?: string;
    /** Chevron on hover (e.g. Chief of Staff, Knowledge, Wisdom). */
    hoverChevron?: boolean;
  };

  const navButton = (
    id: SidebarNavId,
    label: string,
    icon: (active: boolean) => ReactNode,
    options: NavButtonOptions = {},
  ) => {
    const { hoverShortcut, hoverShortcutAria, hoverChevron } = options;
    const active = navRowIsActive(id);

    const row = (
      <button
        type="button"
        className={`${styles.navRow} ${active ? styles.navRowActive : ""} ${
          hoverChevron ? styles.navRowWithHoverChevron : ""
        } ${hoverShortcut ? styles.navRowWithHoverShortcut : ""}`}
        onClick={() => schedulePlainNavClick(id)}
        {...(hoverShortcut && hoverShortcutAria
          ? ({ "aria-keyshortcuts": hoverShortcutAria } as const)
          : undefined)}
      >
        {icon(active)}
        <span className={styles.navLabel}>{label}</span>
        {hoverShortcut ? (
          <span className={styles.navShortcut} aria-hidden>
            {hoverShortcut}
          </span>
        ) : null}
        {hoverChevron ? (
          <span className={styles.navChevron} aria-hidden>
            <NavHoverChevron />
          </span>
        ) : null}
      </button>
    );

    if (isCollapsedRail) {
      return (
        <Tooltip
          label={label}
          shortcut={hoverShortcut}
          wrapperClassName={styles.collapsedNavTooltipWrap}
        >
          {row}
        </Tooltip>
      );
    }

    return row;
  };

  return (
    <aside
      className={`${styles.sidebar} ${
        isCollapsedRail ? styles.sidebarCollapsed : ""
      }`}
      aria-label="Main navigation"
      onMouseEnter={sidebarCollapsed ? onSidebarPeekMouseEnter : undefined}
      onMouseLeave={sidebarCollapsed ? onSidebarPeekMouseLeave : undefined}
      onFocus={sidebarCollapsed ? onSidebarPeekFocusIn : undefined}
      onBlur={sidebarCollapsed ? onSidebarPeekFocusOut : undefined}
    >
      <header
        className={`${styles.header} ${
          headerScrolled ? styles.headerScrolled : ""
        }`.trim()}
      >
        <div className={styles.logoRow}>
          <div
            className={`${styles.logoColumn} ${
              isCollapsedRail ? styles.logoColumnCollapsed : ""
            }`.trim()}
          >
            <div className={styles.logo}>
              <img
                src={logoSrc}
                alt=""
                width={40}
                height={40}
                decoding="async"
              />
            </div>
            {isCollapsedRail ? (
              <div
                className={styles.logoAnchorCollapsed}
                onMouseEnter={() => openMenuPeek()}
              >
                <button
                  type="button"
                  className={styles.collapsedOpenHitArea}
                  onClick={() => onToggleCollapse?.()}
                  aria-label="Open sidebar"
                  aria-keyshortcuts={SIDEBAR_TOGGLE_ARIA_KEYSHORTCUTS}
                />
              </div>
            ) : null}
          </div>
          {!isCollapsedRail ? (
            <Tooltip
              label={collapseHeaderActionLabel}
              shortcut={collapseHeaderShortcutDisplay}
            >
              <button
                type="button"
                className={styles.collapseBtn}
                onClick={() => onToggleCollapse?.()}
                aria-label={collapseHeaderActionLabel}
                aria-keyshortcuts={collapseHeaderAriaKeyShortcuts}
              >
                <HugeiconsIcon
                  icon={collapseHeaderIcon}
                  size={20}
                  strokeWidth={1.75}
                  color="currentColor"
                  aria-hidden
                />
              </button>
            </Tooltip>
          ) : null}
        </div>
        {!isCollapsedRail ? (
          <div className={styles.headline}>
            <div className={styles.orgNameRow}>
              <p className={styles.orgName}>{organizationName}</p>
              <span className={styles.orgNameChevron} aria-hidden>
                <WorkspaceSwitcherChevron />
              </span>
            </div>
            <p className={styles.userName}>{userName}</p>
          </div>
        ) : null}
      </header>

      <nav
        ref={menuScrollRef}
        className={styles.menu}
        onClick={sidebarCollapsed ? handleCollapsedMenuClick : undefined}
        onMouseEnter={sidebarCollapsed ? onMenuPeekMouseEnter : undefined}
      >
        <div className={styles.section}>
          <p className={styles.sectionLabel}>Actions</p>
          {navButton(
            "new-question",
            "New question",
            () => <NewQuestionIcon />,
            newQuestionShortcutBadge !== undefined
              ? {
                  hoverShortcut: newQuestionShortcutBadge,
                  hoverShortcutAria: NEW_QUESTION_SHORTCUT_ARIA,
                }
              : {},
          )}
          {wrapCollapsedNavLabel(
            "Chief of Staff",
            <button
              type="button"
              className={`${styles.navRow} ${
                navRowIsActive("chief-of-staff") ? styles.navRowActive : ""
              } ${styles.navRowWithHoverChevron} ${styles.navRowExpandableSubNav} ${
                chiefOfStaffListOpen ? styles.navRowSubNavExpanded : ""
              }`}
              aria-expanded={
                activeNavId === "chief-of-staff"
                  ? chiefOfStaffListOpen
                  : undefined
              }
              onClick={() => handleExpandableNavClick("chief-of-staff")}
            >
              <NavIcon icon={LocationUser03Icon} />
              <span className={styles.navLabel}>Chief of Staff</span>
              <span className={styles.navChevron} aria-hidden>
                <NavHoverChevron />
              </span>
            </button>,
          )}
          <ExpandableSubNavList
            items={chiefOfStaffItems}
            ariaLabel="Chief of Staff"
            expanded={
              activeNavId === "chief-of-staff" && chiefOfStaffListOpen
            }
            selectedTitle={
              menuSelectionSuppressedByChat ? null : selectedChiefOfStaffItem
            }
            onItemClick={onChiefOfStaffItemClick}
            keyPrefix="cos"
          />
          {navButton("reports", "Reports", () => (
            <NavIcon icon={DocumentAttachmentIcon} />
          ))}
          {navButton("post-meeting-insights", "Post meeting insights", () => (
            <NavIcon icon={FileViewIcon} />
          ))}
        </div>

        <div className={styles.section}>
          <p className={styles.sectionLabel}>Intelligence</p>
          {wrapCollapsedNavLabel(
            "Knowledge",
            <button
              type="button"
              className={`${styles.navRow} ${
                navRowIsActive("knowledge") ? styles.navRowActive : ""
              } ${styles.navRowWithHoverChevron} ${styles.navRowExpandableSubNav} ${
                knowledgeListOpen ? styles.navRowSubNavExpanded : ""
              }`}
              aria-expanded={
                activeNavId === "knowledge" ? knowledgeListOpen : undefined
              }
              onClick={() => handleExpandableNavClick("knowledge")}
            >
              <NavIcon icon={BookBookmark02Icon} />
              <span className={styles.navLabel}>Knowledge</span>
              <span className={styles.navChevron} aria-hidden>
                <NavHoverChevron />
              </span>
            </button>,
          )}
          <ExpandableSubNavList
            items={knowledgeItems}
            ariaLabel="Knowledge"
            expanded={activeNavId === "knowledge" && knowledgeListOpen}
            selectedTitle={
              menuSelectionSuppressedByChat ? null : selectedKnowledgeItem
            }
            onItemClick={onKnowledgeItemClick}
            keyPrefix="know"
          />
          {wrapCollapsedNavLabel(
            "Controls",
            <button
              type="button"
              className={`${styles.navRow} ${
                navRowIsActive("controls") ? styles.navRowActive : ""
              } ${styles.navRowWithHoverChevron} ${styles.navRowExpandableSubNav} ${
                controlsListOpen ? styles.navRowSubNavExpanded : ""
              }`}
              aria-expanded={
                activeNavId === "controls" ? controlsListOpen : undefined
              }
              onClick={() => handleExpandableNavClick("controls")}
            >
              <NavIcon icon={Settings04Icon} />
              <span className={styles.navLabel}>Controls</span>
              <span className={styles.navChevron} aria-hidden>
                <NavHoverChevron />
              </span>
            </button>,
          )}
          <ExpandableSubNavList
            items={controlsItems}
            ariaLabel="Controls"
            expanded={activeNavId === "controls" && controlsListOpen}
            selectedTitle={
              menuSelectionSuppressedByChat ? null : selectedControlsItem
            }
            onItemClick={onControlsItemClick}
            keyPrefix="ctrl"
          />
          {wrapCollapsedNavLabel(
            "Wisdom",
            <button
              type="button"
              className={`${styles.navRow} ${
                navRowIsActive("wisdom") ? styles.navRowActive : ""
              } ${styles.navRowWithHoverChevron} ${styles.navRowExpandableSubNav} ${
                wisdomListOpen ? styles.navRowSubNavExpanded : ""
              }`}
              aria-expanded={
                activeNavId === "wisdom" ? wisdomListOpen : undefined
              }
              onClick={() => handleExpandableNavClick("wisdom")}
            >
              <NavIcon icon={Brain03Icon} />
              <span className={styles.navLabel}>Wisdom</span>
              <span className={styles.navChevron} aria-hidden>
                <NavHoverChevron />
              </span>
            </button>,
          )}
          <ExpandableSubNavList
            items={wisdomItems}
            ariaLabel="Wisdom"
            expanded={activeNavId === "wisdom" && wisdomListOpen}
            selectedTitle={
              menuSelectionSuppressedByChat ? null : selectedWisdomItem
            }
            onItemClick={onWisdomItemClick}
            keyPrefix="wis"
          />
        </div>

        {starredChatsOrdered.length > 0 ? (
          <div
            className={styles.section}
            data-menu-section="starred"
          >
            <button
              type="button"
              className={`${styles.sectionHeadline} ${!starredOpen ? styles.sectionHeadlineCollapsed : ""}`}
              onClick={() => setStarredOpen((open) => !open)}
              aria-expanded={starredOpen}
            >
              <span className={styles.sectionHeadlineInner}>
                <span className={styles.sectionHeadlineLabel}>Starred</span>
                <span className={styles.sectionHeadChevron} aria-hidden>
                  <NavHoverChevron />
                </span>
              </span>
            </button>
            {starredOpen
              ? starredChatsOrdered.map((chat, index) => (
                  <div
                    key={`starred-${chat.id}`}
                    className={`${styles.chatRow} ${styles.chatRowStarred} ${
                      selectedChat?.section === "starred" &&
                      selectedChat.chatId === chat.id
                        ? styles.chatRowSelected
                        : ""
                    }`}
                  >
                    <button
                      type="button"
                      className={styles.chatRowMain}
                      aria-current={
                        selectedChat?.section === "starred" &&
                        selectedChat.chatId === chat.id
                          ? "true"
                          : undefined
                      }
                      onClick={() => onChatClick?.(chat, "starred", index)}
                    >
                      <span className={styles.chatLabel}>{chat.title}</span>
                    </button>
                    <span className={styles.chatStarTooltipWrap}>
                      <button
                        type="button"
                        className={styles.chatStarBtn}
                        aria-label={`Remove «${chat.title}» from Starred`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveStarredChat?.(chat.id);
                        }}
                      >
                        <HugeiconsIcon
                          icon={StarIcon}
                          size={CHAT_STAR_ICON_PX}
                          strokeWidth={1.5}
                          color="currentColor"
                          aria-hidden
                        />
                      </button>
                    </span>
                  </div>
                ))
              : null}
          </div>
        ) : null}

        <div className={styles.section} data-menu-section="recents">
          <button
            type="button"
            className={`${styles.sectionHeadline} ${!recentsOpen ? styles.sectionHeadlineCollapsed : ""}`}
            onClick={() => setRecentsOpen((open) => !open)}
            aria-expanded={recentsOpen}
          >
            <span className={styles.sectionHeadlineInner}>
              <span className={styles.sectionHeadlineLabel}>Recents</span>
              <span className={styles.sectionHeadChevron} aria-hidden>
                <NavHoverChevron />
              </span>
            </span>
          </button>
          {recentsOpen
            ? recentChats.map((chat, index) => {
                const isStarredInList = starredIdSet.has(chat.id);
                return (
                  <div
                    key={`recent-${chat.id}`}
                    className={`${styles.chatRow} ${styles.chatRowRecent} ${
                      selectedChat?.section === "recents" &&
                      selectedChat.chatId === chat.id
                        ? styles.chatRowSelected
                        : ""
                    }`}
                  >
                    <button
                      type="button"
                      className={styles.chatRowMain}
                      aria-current={
                        selectedChat?.section === "recents" &&
                        selectedChat.chatId === chat.id
                          ? "true"
                          : undefined
                      }
                      onClick={() => onChatClick?.(chat, "recents", index)}
                    >
                      <span className={styles.chatLabel}>{chat.title}</span>
                    </button>
                    <span className={styles.chatStarTooltipWrap}>
                      <button
                        type="button"
                        className={`${styles.chatStarBtn} ${
                          isStarredInList ? styles.chatStarInStarred : ""
                        }`}
                        aria-label={
                          isStarredInList
                            ? `Remove «${chat.title}» from Starred`
                            : `Add «${chat.title}» to Starred`
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleRecentStar?.(chat.id);
                        }}
                      >
                        <HugeiconsIcon
                          icon={StarIcon}
                          size={CHAT_STAR_ICON_PX}
                          strokeWidth={1.5}
                          color="currentColor"
                          aria-hidden
                        />
                      </button>
                    </span>
                  </div>
                );
              })
            : null}
        </div>
        {isCollapsedRail ? (
          <div className={styles.menuCollapsedSpacer} aria-hidden />
        ) : null}
      </nav>
    </aside>
  );
}
