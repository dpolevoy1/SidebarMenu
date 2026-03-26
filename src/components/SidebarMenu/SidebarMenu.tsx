import { useEffect, useRef, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  BookBookmark02Icon,
  Brain03Icon,
  DocumentAttachmentIcon,
  FileViewIcon,
  LocationUser03Icon,
  PanelLeftIcon,
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

/** Ignore “hover” on the collapsed logo briefly after toggling so :hover doesn’t apply immediately. */
const COLLAPSED_LOGO_HOVER_SUPPRESS_MS = 220;

/** Starred / Recents row control — icon 14×14 inside 20×20 hit target (see `.chatStarBtn` in CSS). */
const CHAT_STAR_ICON_PX = 14;

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

export interface SidebarMenuProps {
  organizationName: string;
  userName: string;
  logoSrc?: string;
  activeNavId?: SidebarNavId;
  /** Highlights a Starred / Recents row with the selected style when set (index matches list position). */
  selectedChat?: { section: "starred" | "recents"; index: number } | null;
  /**
   * Shortcut shown on the right of "New question" on hover/focus (inline in the row).
   * Defaults to "⇧⌘O". Pass `null` to hide it and omit `aria-keyshortcuts` on that control.
   */
  newQuestionShortcut?: string | null;
  onNavClick?: (id: SidebarNavId) => void;
  onToggleCollapse?: () => void;
  /** When true, sidebar is collapsed; collapse button shows "Open sidebar" tooltip. */
  sidebarCollapsed?: boolean;
  starredChats?: string[];
  recentChats?: string[];
  onChatClick?: (
    title: string,
    section: "starred" | "recents",
    index: number,
  ) => void;
  /** Remove a chat from Starred (star control). */
  onRemoveStarredChat?: (title: string, index: number) => void;
  /**
   * Toggle Starred from a Recents row: gray star adds the chat to Starred (orange);
   * orange star removes it from Starred and returns the Recents star to gray.
   */
  onToggleRecentStar?: (title: string) => void;
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
  starredChats = [
    "CRM/Marketing automation spend per MAU",
    "Klaviyo vs Braze MAU comparison",
    "CRM/Marketing automation spend per MAU",
    "Daily insights for Dove skincare brand",
    "Klaviyo vs Braze MAU comparison",
  ],
  recentChats = [
    "Assemble Demo generation",
    "ABI x Unilever",
    "Assemble Projects Documentation 2026",
    "AstraZeneca account summary",
    "Revlon AI workflow transformation",
    "[beta.2] Unilever S&OP analytics report",
    "[beta.1] Unilever S&OP analytics report",
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
  /** Brief row id: after mouse leaves a chat row, show star + label for 100ms (matches design hover-out). */
  const [starExitHint, setStarExitHint] = useState<string | null>(null);
  const starExitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingNavTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const collapsedLogoAnchorRef = useRef<HTMLDivElement>(null);
  const menuScrollRef = useRef<HTMLElement>(null);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const collapsedLogoHoverSuppressedUntilRef = useRef(0);
  /** When true, show collapsed-logo “open” panel affordance (mouse); keyboard uses :focus-visible in CSS. */
  const [collapsedLogoHover, setCollapsedLogoHover] = useState(false);

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
  }, [sidebarCollapsed]);

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
      if (starExitTimerRef.current !== null) {
        clearTimeout(starExitTimerRef.current);
      }
      clearPendingNavTimeout();
    };
  }, []);

  useEffect(() => {
    if (sidebarCollapsed) {
      clearPendingNavTimeout();
      setChiefOfStaffListOpen(false);
      setKnowledgeListOpen(false);
      setControlsListOpen(false);
      setWisdomListOpen(false);
    }
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (!sidebarCollapsed) {
      setCollapsedLogoHover(false);
      return;
    }
    collapsedLogoHoverSuppressedUntilRef.current =
      Date.now() + COLLAPSED_LOGO_HOVER_SUPPRESS_MS;
    setCollapsedLogoHover(false);
    const t = window.setTimeout(() => {
      const el = collapsedLogoAnchorRef.current;
      if (el?.matches(":hover")) setCollapsedLogoHover(true);
    }, COLLAPSED_LOGO_HOVER_SUPPRESS_MS + 20);
    return () => window.clearTimeout(t);
  }, [sidebarCollapsed]);

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

  const clearStarExitHint = () => {
    if (starExitTimerRef.current !== null) {
      clearTimeout(starExitTimerRef.current);
      starExitTimerRef.current = null;
    }
    setStarExitHint(null);
  };

  const scheduleStarExitHint = (rowKey: string) => {
    if (starExitTimerRef.current !== null) {
      clearTimeout(starExitTimerRef.current);
      starExitTimerRef.current = null;
    }
    setStarExitHint(rowKey);
    starExitTimerRef.current = setTimeout(() => {
      setStarExitHint(null);
      starExitTimerRef.current = null;
    }, 100);
  };

  const newQuestionShortcutBadge =
    newQuestionShortcut === null ? undefined : (newQuestionShortcut ?? "⇧⌘O");

  /** One primary selection in the menu; when a Starred/Recents chat is selected, nav + sub-nav must not show active styling. */
  const menuSelectionSuppressedByChat = selectedChat != null;
  const navRowIsActive = (id: SidebarNavId) =>
    !menuSelectionSuppressedByChat && activeNavId === id;

  const collapseActionLabel = sidebarCollapsed ? "Open sidebar" : "Collapse sidebar";

  const onCollapsedLogoMouseEnter = () => {
    if (Date.now() < collapsedLogoHoverSuppressedUntilRef.current) return;
    setCollapsedLogoHover(true);
  };

  const onCollapsedLogoMouseLeave = () => setCollapsedLogoHover(false);

  const wrapCollapsedNavLabel = (label: string, node: ReactNode) => {
    if (!sidebarCollapsed) return node;
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
    /** Chevron on hover (e.g. Chief of Staff, Knowledge, Wisdom). */
    hoverChevron?: boolean;
  };

  const navButton = (
    id: SidebarNavId,
    label: string,
    icon: (active: boolean) => ReactNode,
    options: NavButtonOptions = {},
  ) => {
    const { hoverShortcut, hoverChevron } = options;
    const active = navRowIsActive(id);

    const row = (
      <button
        type="button"
        className={`${styles.navRow} ${active ? styles.navRowActive : ""} ${
          hoverChevron ? styles.navRowWithHoverChevron : ""
        } ${hoverShortcut ? styles.navRowWithHoverShortcut : ""}`}
        onClick={() => schedulePlainNavClick(id)}
        {...(hoverShortcut
          ? ({ "aria-keyshortcuts": "Shift+Meta+O" } as const)
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

    if (sidebarCollapsed) {
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
        sidebarCollapsed ? styles.sidebarCollapsed : ""
      }`}
      aria-label="Main navigation"
    >
      <header
        className={`${styles.header} ${
          headerScrolled ? styles.headerScrolled : ""
        }`.trim()}
      >
        <div className={styles.logoRow}>
          <div
            className={`${styles.logoColumn} ${
              sidebarCollapsed ? styles.logoColumnCollapsed : ""
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
            {sidebarCollapsed ? (
              <Tooltip
                label="Open sidebar"
                shortcut="⌘."
                wrapperClassName={styles.collapsedLogoTooltipWrap}
              >
                <div
                  ref={collapsedLogoAnchorRef}
                  className={`${styles.logoAnchorCollapsed} ${
                    collapsedLogoHover ? styles.logoAnchorCollapsedHover : ""
                  }`.trim()}
                  onMouseEnter={onCollapsedLogoMouseEnter}
                  onMouseLeave={onCollapsedLogoMouseLeave}
                >
                  <span
                    className={styles.collapsedSidebarCtrlIcon}
                    aria-hidden
                  >
                    <HugeiconsIcon
                      icon={PanelLeftIcon}
                      size={20}
                      strokeWidth={1.75}
                      color="currentColor"
                      aria-hidden
                    />
                  </span>
                  <button
                    type="button"
                    className={styles.collapsedOpenHitArea}
                    onClick={() => onToggleCollapse?.()}
                    aria-label="Open sidebar"
                    aria-keyshortcuts="Meta+Period"
                  />
                </div>
              </Tooltip>
            ) : null}
          </div>
          {!sidebarCollapsed ? (
            <Tooltip label={collapseActionLabel} shortcut="⌘.">
              <button
                type="button"
                className={styles.collapseBtn}
                onClick={() => onToggleCollapse?.()}
                aria-label={collapseActionLabel}
                aria-keyshortcuts="Meta+Period"
              >
                <HugeiconsIcon
                  icon={PanelLeftIcon}
                  size={20}
                  strokeWidth={1.75}
                  color="currentColor"
                  aria-hidden
                />
              </button>
            </Tooltip>
          ) : null}
        </div>
        {!sidebarCollapsed ? (
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
      >
        <div className={styles.section}>
          <p className={styles.sectionLabel}>Actions</p>
          {navButton(
            "new-question",
            "New question",
            () => <NewQuestionIcon />,
            newQuestionShortcutBadge !== undefined
              ? { hoverShortcut: newQuestionShortcutBadge }
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

        <div className={styles.section}>
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
            ? starredChats.map((title, index) => (
                <div
                  key={`starred-${index}-${title}`}
                  className={`${styles.chatRow} ${styles.chatRowStarred} ${
                    selectedChat?.section === "starred" &&
                    selectedChat.index === index
                      ? styles.chatRowSelected
                      : ""
                  } ${
                    starExitHint === `starred-${index}`
                      ? styles.chatRowStarExitHint
                      : ""
                  }`}
                  onMouseEnter={clearStarExitHint}
                  onMouseLeave={() => scheduleStarExitHint(`starred-${index}`)}
                >
                  <button
                    type="button"
                    className={styles.chatRowMain}
                    aria-current={
                      selectedChat?.section === "starred" &&
                      selectedChat.index === index
                        ? "true"
                        : undefined
                    }
                    onClick={() => onChatClick?.(title, "starred", index)}
                  >
                    <span className={styles.chatLabel}>{title}</span>
                  </button>
                  <span className={styles.chatStarTooltipWrap}>
                    {starExitHint === `starred-${index}` ? (
                      <span className={styles.chatStarExitLabel} aria-hidden>
                        Remove from Starred
                      </span>
                    ) : null}
                    <button
                      type="button"
                      className={styles.chatStarBtn}
                      aria-label={`Remove «${title}» from Starred`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveStarredChat?.(title, index);
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

        <div className={styles.section}>
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
            ? recentChats.map((title, index) => {
                const isStarredInList = starredChats.includes(title);
                return (
                  <div
                    key={`recent-${index}-${title}`}
                    className={`${styles.chatRow} ${styles.chatRowRecent} ${
                      selectedChat?.section === "recents" &&
                      selectedChat.index === index
                        ? styles.chatRowSelected
                        : ""
                    } ${
                      starExitHint === `recents-${index}`
                        ? styles.chatRowStarExitHint
                        : ""
                    }`}
                    onMouseEnter={clearStarExitHint}
                    onMouseLeave={() => scheduleStarExitHint(`recents-${index}`)}
                  >
                    <button
                      type="button"
                      className={styles.chatRowMain}
                      aria-current={
                        selectedChat?.section === "recents" &&
                        selectedChat.index === index
                          ? "true"
                          : undefined
                      }
                      onClick={() => onChatClick?.(title, "recents", index)}
                    >
                      <span className={styles.chatLabel}>{title}</span>
                    </button>
                    <span className={styles.chatStarTooltipWrap}>
                      {starExitHint === `recents-${index}` ? (
                        <span className={styles.chatStarExitLabel} aria-hidden>
                          {isStarredInList
                            ? "Remove from Starred"
                            : "Add to Starred"}
                        </span>
                      ) : null}
                      <button
                        type="button"
                        className={`${styles.chatStarBtn} ${
                          isStarredInList ? styles.chatStarInStarred : ""
                        }`}
                        aria-label={
                          isStarredInList
                            ? `Remove «${title}» from Starred`
                            : `Add «${title}» to Starred`
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleRecentStar?.(title);
                          e.currentTarget.blur();
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
        {sidebarCollapsed ? (
          <div className={styles.menuCollapsedSpacer} aria-hidden />
        ) : null}
      </nav>
    </aside>
  );
}
