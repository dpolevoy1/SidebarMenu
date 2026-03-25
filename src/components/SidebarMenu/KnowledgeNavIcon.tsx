import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import type { RefObject } from "react";
import knowledgeAnimation from "../../assets/lottie/ic_knowledge.json";
import styles from "./SidebarMenu.module.css";

export type KnowledgeNavIconProps = {
  lottieRef: RefObject<LottieRefCurrentProps | null>;
};

/** Knowledge nav row — Lottie from `src/assets/lottie/ic_knowledge.json`. */
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
