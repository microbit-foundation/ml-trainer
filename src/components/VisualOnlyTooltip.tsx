/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { css, Tooltip, TooltipProps } from "@microbit/ui";

interface VisualOnlyTooltipProps {
  children: ReactElement;
  /** Tooltip body. */
  label: ReactNode;
  placement?: TooltipProps["placement"];
  hasArrow?: boolean;
}

/**
 * @deprecated A tooltip on a trigger that is deliberately not focusable, so its
 * text is reachable by neither keyboard nor screen reader. The escape hatch for
 * RecordingFingerprint's data features, where one tab stop per column would
 * swamp the tab order, until an accessible presentation of that data exists.
 * Use `TooltipButton` from @microbit/ui for anything new.
 */
const VisualOnlyTooltip = ({
  children,
  label,
  placement,
  hasArrow,
}: VisualOnlyTooltipProps) => {
  const [isOpen, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const handleMouseEnter = useCallback(() => setOpen(true), []);
  const handleMouseLeave = useCallback(() => setOpen(false), []);
  const handleClick = useCallback(() => setOpen((open) => !open), []);
  // Dismissable without moving the pointer (WCAG 1.4.13). Capture and stop the
  // event as react-aria's own tooltips do, so this doesn't also close a
  // surrounding dialog.
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener("keydown", listener, true);
    return () => document.removeEventListener("keydown", listener, true);
  }, [isOpen]);
  return (
    <Tooltip
      label={label}
      placement={placement}
      hasArrow={hasArrow}
      isOpen={isOpen}
      triggerRef={ref}
    >
      <span
        ref={ref}
        className={css({ display: "flex", w: "100%", h: "100%" })}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {children}
      </span>
    </Tooltip>
  );
};

export default VisualOnlyTooltip;
