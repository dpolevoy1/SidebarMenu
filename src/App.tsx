import { useState } from "react";
import {
  SidebarMenu,
  DEFAULT_CHIEF_OF_STAFF_ITEMS,
  DEFAULT_CONTROLS_ITEMS,
  DEFAULT_KNOWLEDGE_ITEMS,
  DEFAULT_WISDOM_ITEMS,
  type SidebarNavId,
} from "./components/SidebarMenu";

const INITIAL_STARRED_CHATS = [
  "CRM/Marketing automation spend per MAU",
  "Klaviyo vs Braze MAU comparison",
  "CRM/Marketing automation spend per MAU",
  "Daily insights for Dove skincare brand",
  "Klaviyo vs Braze MAU comparison",
];

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeNavId, setActiveNavId] = useState<SidebarNavId>(
    "post-meeting-insights",
  );
  const [starredChats, setStarredChats] = useState<string[]>(
    INITIAL_STARRED_CHATS,
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

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <SidebarMenu
        organizationName="Unilever"
        userName="Maximilian Metti"
        sidebarCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        activeNavId={activeNavId}
        onNavClick={(id) => {
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
          setSelectedChiefOfStaffItem(title);
        }}
        selectedKnowledgeItem={selectedKnowledgeItem}
        onKnowledgeItemClick={(title) => {
          setSelectedKnowledgeItem(title);
        }}
        selectedControlsItem={selectedControlsItem}
        onControlsItemClick={(title) => {
          setSelectedControlsItem(title);
        }}
        selectedWisdomItem={selectedWisdomItem}
        onWisdomItemClick={(title) => {
          setSelectedWisdomItem(title);
        }}
        starredChats={starredChats}
        onRemoveStarredChat={(_title, index) => {
          setStarredChats((prev) => prev.filter((_, i) => i !== index));
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
  );
}
