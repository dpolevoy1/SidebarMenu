import { useEffect, useRef, useState } from "react";
import { Agentation } from "agentation";
import {
  SidebarMenu,
  DEFAULT_CHIEF_OF_STAFF_ITEMS,
  DEFAULT_CONTROLS_ITEMS,
  DEFAULT_KNOWLEDGE_ITEMS,
  DEFAULT_WISDOM_ITEMS,
  type SidebarChatItem,
  type SidebarNavId,
} from "./components/SidebarMenu";

/** Full chat list; Starred is filtered by `INITIAL_STARRED_IDS`. */
const INITIAL_RECENT_CHATS: SidebarChatItem[] = [
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
];

/** Subset of `INITIAL_RECENT_CHATS` ids; Starred UI follows Recents order. */
const INITIAL_STARRED_IDS = [
  "chat-assemble-demo",
  "chat-crm-mau",
  "chat-dove-daily",
];
const THEME_TRANSITION_MS = 220;

export default function App() {
  const hasMountedRef = useRef(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [activeNavId, setActiveNavId] = useState<SidebarNavId>(
    "post-meeting-insights",
  );
  const [recentChats] = useState<SidebarChatItem[]>(INITIAL_RECENT_CHATS);
  const [starredChatIds, setStarredChatIds] =
    useState<string[]>(INITIAL_STARRED_IDS);
  const [selectedChiefOfStaffItem, setSelectedChiefOfStaffItem] = useState<
    string | null
  >(null);
  const [selectedKnowledgeItem, setSelectedKnowledgeItem] = useState<
    string | null
  >(null);
  const [selectedControlsItem, setSelectedControlsItem] = useState<
    string | null
  >(null);
  const [selectedWisdomItem, setSelectedWisdomItem] = useState<string | null>(
    null,
  );
  const [selectedChat, setSelectedChat] = useState<{
    section: "starred" | "recents";
    chatId: string;
  } | null>(null);

  useEffect(() => {
    const starred = new Set(starredChatIds);
    const hasStarredRows = recentChats.some((c) => starred.has(c.id));
    if (!hasStarredRows) {
      setSelectedChat((prev) =>
        prev?.section === "starred" ? null : prev,
      );
    }
  }, [starredChatIds, recentChats]);

  useEffect(() => {
    const root = document.documentElement;
    const nextTheme = darkModeEnabled ? "dark" : "light";

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      root.setAttribute("data-theme", nextTheme);
      return;
    }
    root.setAttribute("data-theme-transition", "true");
    root.setAttribute("data-theme", nextTheme);

    const timer = window.setTimeout(
      () => root.removeAttribute("data-theme-transition"),
      THEME_TRANSITION_MS,
    );
    return () => {
      window.clearTimeout(timer);
      root.removeAttribute("data-theme-transition");
    };
  }, [darkModeEnabled]);

  return (
    <>
      <div className="appLayout">
        <SidebarMenu
          organizationName="Unilever"
          userName="Maximilian Metti"
          darkModeEnabled={darkModeEnabled}
          onDarkModeChange={setDarkModeEnabled}
          sidebarCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
          activeNavId={activeNavId}
          onNavClick={(id) => {
            setSelectedChat(null);
            setActiveNavId(id);
            if (id === "chief-of-staff") {
              if (id !== activeNavId) setSelectedChiefOfStaffItem(DEFAULT_CHIEF_OF_STAFF_ITEMS[0]!);
            } else {
              setSelectedChiefOfStaffItem(null);
            }
            if (id === "knowledge") {
              if (id !== activeNavId) setSelectedKnowledgeItem(DEFAULT_KNOWLEDGE_ITEMS[0]!);
            } else {
              setSelectedKnowledgeItem(null);
            }
            if (id === "controls") {
              if (id !== activeNavId) setSelectedControlsItem(DEFAULT_CONTROLS_ITEMS[0]!);
            } else {
              setSelectedControlsItem(null);
            }
            if (id === "wisdom") {
              if (id !== activeNavId) setSelectedWisdomItem(DEFAULT_WISDOM_ITEMS[0]!);
            } else {
              setSelectedWisdomItem(null);
            }
          }}
          selectedChiefOfStaffItem={selectedChiefOfStaffItem}
          onChiefOfStaffItemClick={(title) => {
            setSelectedChat(null);
            setSelectedChiefOfStaffItem(title);
          }}
          selectedKnowledgeItem={selectedKnowledgeItem}
          onKnowledgeItemClick={(title) => {
            setSelectedChat(null);
            setSelectedKnowledgeItem(title);
          }}
          selectedControlsItem={selectedControlsItem}
          onControlsItemClick={(title) => {
            setSelectedChat(null);
            setSelectedControlsItem(title);
          }}
          selectedWisdomItem={selectedWisdomItem}
          onWisdomItemClick={(title) => {
            setSelectedChat(null);
            setSelectedWisdomItem(title);
          }}
          recentChats={recentChats}
          starredChatIds={starredChatIds}
          selectedChat={selectedChat}
          onChatClick={(chat, section) => {
            setSelectedChat({ section, chatId: chat.id });
            setSelectedChiefOfStaffItem(null);
            setSelectedKnowledgeItem(null);
            setSelectedControlsItem(null);
            setSelectedWisdomItem(null);
            setActiveNavId("post-meeting-insights");
            if (section === "recents") {
              setStarredChatIds((prev) => {
                if (!prev.includes(chat.id)) return prev;
                return [chat.id, ...prev.filter((id) => id !== chat.id)];
              });
            }
          }}
          onRemoveStarredChat={(chatId) => {
            setStarredChatIds((prev) => prev.filter((id) => id !== chatId));
            setSelectedChat((prev) =>
              prev?.section === "starred" && prev.chatId === chatId
                ? null
                : prev,
            );
          }}
          onToggleRecentStar={(chatId) => {
            setStarredChatIds((prev) =>
              prev.includes(chatId)
                ? prev.filter((id) => id !== chatId)
                : [chatId, ...prev],
            );
          }}
        />
        <main className="contentShell">
          <section className="contentViewport" aria-label="Main content area" />
        </main>
      </div>
      <Agentation endpoint="http://localhost:4747" />
    </>
  );
}
