/**
 * Default Assemble tooltip — use `Tooltip` for all standard tooltips unless a
 * screen explicitly specifies a different pattern. Styling and pointer/focus
 * placement live in `Tooltip.module.css` and are the design-system default
 * (right of the cursor, slightly below; same relationship for keyboard focus).
 */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import styles from "./Tooltip.module.css";

/** Horizontal gap from cursor — tooltip’s left edge sits at cursor X + GAP_X. */
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

function positionFromElement(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  return {
    left: r.right + GAP_X,
    top: r.top + r.height / 2 + GAP_Y,
  };
}

/**
 * Canonical design-system tooltip — fixed to the **right of the pointer** and
 * **slightly below** it; with keyboard focus, the same offset from the **right
 * edge** of the focused control.
 */
export function Tooltip({
  label,
  shortcut,
  children,
  wrapperClassName,
}: TooltipProps) {
  const wrapRef = useRef<HTMLSpanElement>(null);
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

  const handleMouseLeave = useCallback(
    (e: MouseEvent<HTMLSpanElement>) => {
      mouseInsideRef.current = false;
      const wrap = e.currentTarget;
      if (wrap.matches(":focus-within")) {
        const active = document.activeElement;
        if (
          active instanceof HTMLElement &&
          wrap.contains(active) &&
          active.matches(":focus-visible")
        ) {
          setPos(positionFromElement(active));
          return;
        }
      }
      setPos(null);
    },
    [],
  );

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    let pendingFocusRaf = 0;

    /** Anchor to focused control on any modality. (Mouse-leave still drops the panel unless :focus-visible—avoids stuck tooltips after pointer clicks.) */
    const applyFocusPosition = () => {
      if (!wrap.isConnected) return;
      const active = document.activeElement;
      if (!(active instanceof HTMLElement) || !wrap.contains(active)) return;
      setPos(positionFromElement(active));
    };

    const onFocusIn = (e: FocusEvent) => {
      const t = e.target;
      if (!(t instanceof HTMLElement) || !wrap.contains(t)) return;
      applyFocusPosition();
      if (pendingFocusRaf !== 0) {
        cancelAnimationFrame(pendingFocusRaf);
      }
      pendingFocusRaf = requestAnimationFrame(() => {
        pendingFocusRaf = 0;
        applyFocusPosition();
      });
    };

    const onFocusOut = (e: FocusEvent) => {
      const next = e.relatedTarget as Node | null;
      if (wrap.contains(next)) return;
      if (!mouseInsideRef.current) setPos(null);
    };

    wrap.addEventListener("focusin", onFocusIn);
    wrap.addEventListener("focusout", onFocusOut);
    return () => {
      if (pendingFocusRaf !== 0) {
        cancelAnimationFrame(pendingFocusRaf);
      }
      wrap.removeEventListener("focusin", onFocusIn);
      wrap.removeEventListener("focusout", onFocusOut);
    };
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
        ref={wrapRef}
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
