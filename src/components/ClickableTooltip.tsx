/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
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
import { Focusable } from "react-aria-components";
import { useIntl } from "react-intl";
import { css, cx, Tooltip, TooltipProps } from "../shared-ui";

interface ClickableTooltipProps {
  children: ReactElement;
  /** Tooltip body. */
  label: ReactNode;
  placement?: TooltipProps["placement"];
  hasArrow?: boolean;
  /** Make the trigger keyboard-focusable so the tooltip opens on focus. */
  isFocusable?: boolean;
  titleId?: string;
  isDisabled?: boolean;
}

/**
 * Tooltip that also opens on click/tap (unlike hover-only tooltips, this works
 * on mobile/tablets) and, when `isFocusable`, on keyboard focus. Open state is
 * managed here and the shared-ui Tooltip is fully controlled.
 */
const ClickableTooltip = ({
  children,
  label,
  placement,
  hasArrow,
  isFocusable = false,
  titleId,
  isDisabled,
}: ClickableTooltipProps) => {
  const [isOpen, setOpen] = useState(false);
  const intl = useIntl();
  const ref = useRef<HTMLSpanElement>(null);
  const handleMouseEnter = useCallback(() => {
    const focussedTooltips = Array.from(
      document.querySelectorAll(".focusable-tooltip")
    );
    if (
      focussedTooltips.every((tooltip) => tooltip !== document.activeElement)
    ) {
      setOpen(true);
    }
  }, []);
  const handleMouseLeave = useCallback(() => {
    if (
      !isFocusable ||
      (ref.current !== document.activeElement && isFocusable)
    ) {
      setOpen(false);
    }
  }, [isFocusable]);
  // Close on Escape wherever focus is, like Chakra's closeOnEsc.
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [isOpen]);
  return (
    <Tooltip
      content={label}
      placement={placement}
      hasArrow={hasArrow}
      isOpen={isOpen}
    >
      <Focusable>
        <span
          aria-label={
            titleId
              ? intl.formatMessage({ id: `${titleId}-tooltip-aria` })
              : undefined
          }
          className={cx(
            isFocusable ? "focusable-tooltip" : undefined,
            css({
              display: "flex",
              borderRadius: "50%",
              outline: "none",
              _focusVisible: { boxShadow: "outline" },
            })
          )}
          ref={ref}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={() => setOpen(true)}
          tabIndex={isFocusable && !isDisabled ? 0 : undefined}
          onFocus={isFocusable ? () => setOpen(true) : undefined}
          onBlur={isFocusable ? () => setOpen(false) : undefined}
        >
          {children}
        </span>
      </Focusable>
    </Tooltip>
  );
};

export default ClickableTooltip;
