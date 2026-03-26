/**
 * Default Assemble tooltip — use `Tooltip` for all standard tooltips unless a
 * screen explicitly specifies a different pattern. Styling and pointer
 * placement live in `Tooltip.module.css` and are the design-system default
 * (right of the cursor, slightly below).
 */
import {
  useCallback,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import styles from "./Tooltip.module.css";

/** Horizontal gap from cursor — tooltip's left edge sits at cursor X + GAP_X. */
const GAP_X = 12;
/** Vertical offset so the tooltip sits slightly below the pointer / anchor. */
const GAP_Y = 6;

export type TooltipProps = {
  /** Primary line (Neutral-100). */
  label: string;
  /** Secondary line — e.g. shortcut (Secondary-300). */
  shortcut?: string;
  /** Typically a single button or control. */
  children: ReactNode;
  /** Extra class on the outer wrapper (e.g. absolute anchor for icon buttons). */
  wrapperClassName?: string;
};

/**
 * Canonical design-system tooltip — fixed to the **right of the pointer** and
 * **slightly below** it. Shown **only while the cursor is over the wrapper** (no focus-only tooltip).
 */
export function Tooltip({
  label,
  shortcut,
  children,
  wrapperClassName,
}: TooltipProps) {
  const mouseInsideRef = useRef(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  const updateFromMouse = useCallback(
    (e: { clientX: number; clientY: number }) => {
      setPos({
        left: e.clientX + GAP_X,
        top: e.clientY + GAP_Y,
      });
    },
    [],
  );

  const handleMouseEnter = useCallback(
    (e: MouseEvent<HTMLSpanElement>) => {
      mouseInsideRef.current = true;
      updateFromMouse(e);
    },
    [updateFromMouse],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent<HTMLSpanElement>) => {
      if (mouseInsideRef.current) updateFromMouse(e);
    },
    [updateFromMouse],
  );

  const handleMouseLeave = useCallback(() => {
    mouseInsideRef.current = false;
    setPos(null);
  }, []);

  const panel =
    pos &&
    createPortal(
      <span
        className={styles.panel}
        style={{ left: pos.left, top: pos.top }}
        aria-hidden="true"
      >
        <span className={styles.label}>{label}</span>
        {shortcut ? <span className={styles.shortcut}>{shortcut}</span> : null}
      </span>,
      document.body,
    );

  return (
    <>
      <span
        className={`${styles.wrap} ${wrapperClassName ?? ""}`.trim()}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </span>
      {panel}
    </>
  );
}
