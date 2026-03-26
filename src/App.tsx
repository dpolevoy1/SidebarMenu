import { useEffect, useState } from "react";
import { Agentation } from "agentation";
import {
  SidebarMenu,
  DEFAULT_CHIEF_OF_STAFF_ITEMS,
  DEFAULT_CONTROLS_ITEMS,
  DEFAULT_KNOWLEDGE_ITEMS,
  DEFAULT_WISDOM_ITEMS,
  type SidebarNavId,
} from "./components/SidebarMenu";

/** Full chat list; Starred is only titles from this list that are marked starred. */
const INITIAL_RECENT_CHATS = [
  "Assemble Demo generation",
  "ABI x Unilever",
  "Assemble Projects Documentation 2026",
  "AstraZeneca account summary",
  "Revlon AI workflow transformation",
  "[beta.2] Unilever S&OP analytics report",
  "[beta.1] Unilever S&OP analytics report",
  "CRM/Marketing automation spend per MAU",
  "Klaviyo vs Braze MAU comparison",
  "Daily insights for Dove skincare brand",
];

/** Subset of titles (unique) from `INITIAL_RECENT_CHATS`; Starred UI follows Recents order. */
const INITIAL_STARRED_TITLES = [
  "Assemble Demo generation",
  "CRM/Marketing automation spend per MAU",
  "Daily insights for Dove skincare brand",
];

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeNavId, setActiveNavId] = useState<SidebarNavId>(
    "post-meeting-insights",
  );
  const [recentChats] = useState<string[]>(INITIAL_RECENT_CHATS);
  const [starredChats, setStarredChats] = useState<string[]>(
    INITIAL_STARRED_TITLES,
  );
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
    index: number;
  } | null>(null);

  useEffect(() => {
    const starred = new Set(starredChats);
    const hasStarredRows = recentChats.some((t) => starred.has(t));
    if (!hasStarredRows) {
      setSelectedChat((prev) =>
        prev?.section === "starred" ? null : prev,
      );
    }
  }, [starredChats, recentChats]);

  return (
    <>
      <div style={{ display: "flex", height: "100vh" }}>
        <SidebarMenu
        organizationName="Unilever"
        userName="Maximilian Metti"
        sidebarCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        activeNavId={activeNavId}
        onNavClick={(id) => {
          setSelectedChat(null);
          setActiveNavId(id);
          if (id === "chief-of-staff") {
            setSelectedChiefOfStaffItem(DEFAULT_CHIEF_OF_STAFF_ITEMS[0]!);
          } else {
            setSelectedChiefOfStaffItem(null);
          }
          if (id === "knowledge") {
            setSelectedKnowledgeItem(DEFAULT_KNOWLEDGE_ITEMS[0]!);
          } else {
            setSelectedKnowledgeItem(null);
          }
          if (id === "controls") {
            setSelectedControlsItem(DEFAULT_CONTROLS_ITEMS[0]!);
          } else {
            setSelectedControlsItem(null);
          }
          if (id === "wisdom") {
            setSelectedWisdomItem(DEFAULT_WISDOM_ITEMS[0]!);
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
        starredChats={starredChats}
        selectedChat={selectedChat}
        onChatClick={(_title, section, index) => {
          setSelectedChat({ section, index });
          setSelectedChiefOfStaffItem(null);
          setSelectedKnowledgeItem(null);
          setSelectedControlsItem(null);
          setSelectedWisdomItem(null);
          setActiveNavId("post-meeting-insights");
        }}
        onRemoveStarredChat={(_title, index) => {
          setStarredChats((prev) => prev.filter((t) => t !== _title));
          setSelectedChat((prev) => {
            if (!prev || prev.section !== "starred") return prev;
            if (prev.index === index) return null;
            if (prev.index > index)
              return { section: "starred", index: prev.index - 1 };
            return prev;
          });
        }}
        onToggleRecentStar={(title) => {
          setStarredChats((prev) =>
            prev.includes(title)
              ? prev.filter((t) => t !== title)
              : [title, ...prev],
          );
        }}
        />
      </div>
      <Agentation endpoint="http://localhost:4747" />
    </>
  );
}
