import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import type { RefObject } from "react";
import knowledgeAnimation from "../../assets/logo_animation/ic_knowledge.json";
import styles from "./SidebarMenu.module.css";

export type KnowledgeNavIconProps = {
  lottieRef: RefObject<LottieRefCurrentProps | null>;
};

/**
 * Knowledge nav row icon — Lottie from `ic_knowledge.json`. Playback is driven by the parent
 * row (play once on hover via `goToAndPlay`; `loop` is false).
 */
export function KnowledgeNavIcon({ lottieRef }: KnowledgeNavIconProps) {
  return (
    <span className={styles.navIcon} aria-hidden>
      <Lottie
        className={styles.knowledgeLottie}
        lottieRef={lottieRef}
        animationData={knowledgeAnimation}
        loop={false}
        autoplay={false}
        onDataReady={() => {
          lottieRef.current?.goToAndStop(0, true);
        }}
      />
    </span>
  );
}
