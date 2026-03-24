import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
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
  /** Highlights a Starred / Recents row with the selected style when set. */
  selectedChat?: { section: "starred" | "recents"; title: string } | null;
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
  onChatClick?: (title: string, section: "starred" | "recents") => void;
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
  return (
    <div
      className={`${styles.sidebarSubNavList} ${
        expanded ? styles.sidebarSubNavListExpanded : ""
      }`}
      style={{ "--n": items.length } as React.CSSProperties}
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

  useEffect(() => {
    return () => {
      if (starExitTimerRef.current !== null) {
        clearTimeout(starExitTimerRef.current);
      }
    };
  }, []);

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

  const collapseActionLabel = sidebarCollapsed ? "Open sidebar" : "Collapse sidebar";

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
    const active = activeNavId === id;

    const row = (
      <button
        type="button"
        className={`${styles.navRow} ${active ? styles.navRowActive : ""} ${
          hoverChevron ? styles.navRowWithHoverChevron : ""
        } ${hoverShortcut ? styles.navRowWithHoverShortcut : ""}`}
        onClick={() => onNavClick?.(id)}
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

    return row;
  };

  return (
    <aside className={styles.sidebar} aria-label="Main navigation">
      <header className={styles.header}>
        <div className={styles.logoRow}>
          <div className={styles.logo}>
            <img src={logoSrc} alt="" width={40} height={40} />
          </div>
          <Tooltip label={collapseActionLabel} shortcut="⌘.">
            <button
              type="button"
              className={styles.collapseBtn}
              onClick={onToggleCollapse}
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
        </div>
        <div className={styles.headline}>
          <div className={styles.orgNameRow}>
            <p className={styles.orgName}>{organizationName}</p>
            <span className={styles.orgNameChevron} aria-hidden>
              <WorkspaceSwitcherChevron />
            </span>
          </div>
          <p className={styles.userName}>{userName}</p>
        </div>
      </header>

      <nav className={styles.menu}>
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
          <button
            type="button"
            className={`${styles.navRow} ${
              activeNavId === "chief-of-staff" ? styles.navRowActive : ""
            } ${styles.navRowWithHoverChevron} ${styles.navRowExpandableSubNav} ${
              chiefOfStaffListOpen ? styles.navRowSubNavExpanded : ""
            }`}
            aria-expanded={
              activeNavId === "chief-of-staff"
                ? chiefOfStaffListOpen
                : undefined
            }
            onClick={() => {
              if (activeNavId === "chief-of-staff") {
                setChiefOfStaffListOpen((open) => !open);
              } else {
                setChiefOfStaffListOpen(true);
              }
              onNavClick?.("chief-of-staff");
            }}
          >
            <NavIcon icon={LocationUser03Icon} />
            <span className={styles.navLabel}>Chief of Staff</span>
            <span className={styles.navChevron} aria-hidden>
              <NavHoverChevron />
            </span>
          </button>
          {activeNavId === "chief-of-staff" ? (
            <ExpandableSubNavList
              items={chiefOfStaffItems}
              ariaLabel="Chief of Staff"
              expanded={chiefOfStaffListOpen}
              selectedTitle={selectedChiefOfStaffItem}
              onItemClick={onChiefOfStaffItemClick}
              keyPrefix="cos"
            />
          ) : null}
          {navButton("reports", "Reports", () => (
            <NavIcon icon={DocumentAttachmentIcon} />
          ))}
          {navButton("post-meeting-insights", "Post meeting insights", () => (
            <NavIcon icon={FileViewIcon} />
          ))}
        </div>

        <div className={styles.section}>
          <p className={styles.sectionLabel}>Intelligence</p>
          <button
            type="button"
            className={`${styles.navRow} ${
              activeNavId === "knowledge" ? styles.navRowActive : ""
            } ${styles.navRowWithHoverChevron} ${styles.navRowExpandableSubNav} ${
              knowledgeListOpen ? styles.navRowSubNavExpanded : ""
            }`}
            aria-expanded={
              activeNavId === "knowledge" ? knowledgeListOpen : undefined
            }
            onClick={() => {
              if (activeNavId === "knowledge") {
                setKnowledgeListOpen((open) => !open);
              } else {
                setKnowledgeListOpen(true);
              }
              onNavClick?.("knowledge");
            }}
          >
            <NavIcon icon={BookBookmark02Icon} />
            <span className={styles.navLabel}>Knowledge</span>
            <span className={styles.navChevron} aria-hidden>
              <NavHoverChevron />
            </span>
          </button>
          {activeNavId === "knowledge" ? (
            <ExpandableSubNavList
              items={knowledgeItems}
              ariaLabel="Knowledge"
              expanded={knowledgeListOpen}
              selectedTitle={selectedKnowledgeItem}
              onItemClick={onKnowledgeItemClick}
              keyPrefix="know"
            />
          ) : null}
          <button
            type="button"
            className={`${styles.navRow} ${
              activeNavId === "controls" ? styles.navRowActive : ""
            } ${styles.navRowWithHoverChevron} ${styles.navRowExpandableSubNav} ${
              controlsListOpen ? styles.navRowSubNavExpanded : ""
            }`}
            aria-expanded={
              activeNavId === "controls" ? controlsListOpen : undefined
            }
            onClick={() => {
              if (activeNavId === "controls") {
                setControlsListOpen((open) => !open);
              } else {
                setControlsListOpen(true);
              }
              onNavClick?.("controls");
            }}
          >
            <NavIcon icon={Settings04Icon} />
            <span className={styles.navLabel}>Controls</span>
            <span className={styles.navChevron} aria-hidden>
              <NavHoverChevron />
            </span>
          </button>
          {activeNavId === "controls" ? (
            <ExpandableSubNavList
              items={controlsItems}
              ariaLabel="Controls"
              expanded={controlsListOpen}
              selectedTitle={selectedControlsItem}
              onItemClick={onControlsItemClick}
              keyPrefix="ctrl"
            />
          ) : null}
          <button
            type="button"
            className={`${styles.navRow} ${
              activeNavId === "wisdom" ? styles.navRowActive : ""
            } ${styles.navRowWithHoverChevron} ${styles.navRowExpandableSubNav} ${
              wisdomListOpen ? styles.navRowSubNavExpanded : ""
            }`}
            aria-expanded={
              activeNavId === "wisdom" ? wisdomListOpen : undefined
            }
            onClick={() => {
              if (activeNavId === "wisdom") {
                setWisdomListOpen((open) => !open);
              } else {
                setWisdomListOpen(true);
              }
              onNavClick?.("wisdom");
            }}
          >
            <NavIcon icon={Brain03Icon} />
            <span className={styles.navLabel}>Wisdom</span>
            <span className={styles.navChevron} aria-hidden>
              <NavHoverChevron />
            </span>
          </button>
          {activeNavId === "wisdom" ? (
            <ExpandableSubNavList
              items={wisdomItems}
              ariaLabel="Wisdom"
              expanded={wisdomListOpen}
              selectedTitle={selectedWisdomItem}
              onItemClick={onWisdomItemClick}
              keyPrefix="wis"
            />
          ) : null}
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
                    selectedChat.title === title
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
                    onClick={() => onChatClick?.(title, "starred")}
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
                        size={16}
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
                      selectedChat.title === title
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
                      onClick={() => onChatClick?.(title, "recents")}
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
                          size={16}
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
      </nav>
    </aside>
  );
}
