import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import type { RefObject } from "react";
/**
 * Design: [LottieLab — Knowledge icon](https://www.lottielab.com/editor?project=8c01cbb3-ad89-4d45-a3fb-83d46240cd54).
 * Re-export JSON from LottieLab (File → Export → Lottie JSON) into `src/assets/lottie/ic_knowledge.json` when the project changes.
 */
import knowledgeAnimation from "../../assets/lottie/ic_knowledge.json";
import styles from "./SidebarMenu.module.css";

export type KnowledgeNavIconProps = {
  lottieRef: RefObject<LottieRefCurrentProps | null>;
};

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
