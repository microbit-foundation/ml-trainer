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
  useId,
  useRef,
  useState,
} from "react";
import { useIntl } from "react-intl";
import { css, cx, Tooltip, TooltipProps, VisuallyHidden } from "../shared-ui";

interface ClickableTooltipProps {
  children: ReactElement;
  /** Tooltip body. */
  label: ReactNode;
  placement?: TooltipProps["placement"];
  hasArrow?: boolean;
  titleId?: string;
  isDisabled?: boolean;
  /**
   * Render the tooltip as visual-only: a non-focusable trigger that
   * shows the tooltip on hover/click not keyboard reachable. This is a
   * temporary escape hatch for RecordingFingerprint data features until an
   * accessible solution is implemented.
   */
  visualOnly?: boolean;
}

// Tooltip that also opens on click/tap (unlike hover-only tooltips, this
// works on mobile/tablets) and on keyboard focus.
//
// Touch screen readers (iPadOS VoiceOver / Android TalkBack) never open the
// tooltip, and even when opened its text is only associated with the trigger
// while open. So the text is unreachable on tablets. For the default "button"
// trigger we instead expose the same text on an always-present visually
// hidden node referenced from the button, so it is part of the trigger's
// accessible name/description regardless of the visual tooltip's open state.
// The visible tooltip is aria-hidden to avoid double announcement.
//
// A real <button> is focusable and operable (Enter/Space) on every platform,
// rather than a role="button" span with none of the behaviour.
//
// The visualOnly prop opts out of all of the above (see its doc comment).

const triggerStyle = css({
  display: "flex",
  alignItems: "stretch",
  justifyContent: "center",
  w: "100%",
  h: "100%",
  minW: 0,
  p: 0,
  bg: "transparent",
  border: "none",
  color: "inherit",
  cursor: "pointer",
  borderRadius: "50%",
  outline: "none",
  _focusVisible: { focusShadow: "outline" },
});

const ClickableTooltip = ({
  children,
  label,
  placement,
  hasArrow,
  titleId,
  isDisabled,
  visualOnly = false,
}: ClickableTooltipProps) => {
  const isButton = !visualOnly;
  const [isOpen, setOpen] = useState(false);
  const intl = useIntl();
  const ref = useRef<HTMLSpanElement>(null);
  const descriptionId = useId();
  // Distinguishes keyboard focus (should open) from pointer-driven focus (a
  // tap/click, which toggles via onClick instead — otherwise a tap would open
  // on focus and then immediately toggle closed).
  const pointerDownRef = useRef(false);
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
    // Keep it open while focus is inside the trigger.
    if (!ref.current?.contains(document.activeElement)) {
      setOpen(false);
    }
  }, []);
  const handlePointerDown = useCallback(() => {
    pointerDownRef.current = true;
  }, []);
  const handleFocus = useCallback(() => {
    if (!pointerDownRef.current) {
      setOpen(true);
    }
    pointerDownRef.current = false;
  }, []);
  const handleBlur = useCallback(() => {
    pointerDownRef.current = false;
    setOpen(false);
  }, []);
  const handleClick = useCallback(() => {
    pointerDownRef.current = false;
    setOpen((open) => !open);
  }, []);
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

  const nameProps = titleId
    ? {
        "aria-label": intl.formatMessage({ id: `${titleId}-tooltip-aria` }),
        "aria-describedby": descriptionId,
      }
    : { "aria-labelledby": descriptionId };

  return (
    <Tooltip
      content={isButton ? <div aria-hidden={true}>{label}</div> : label}
      placement={placement}
      hasArrow={hasArrow}
      isOpen={isOpen && !isDisabled}
      triggerRef={ref}
    >
      <span
        ref={ref}
        className={css({ display: "flex" })}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {isButton ? (
          <button
            type="button"
            {...nameProps}
            className={cx("focusable-tooltip", triggerStyle)}
            // Out of the tab order while the surrounding UI is disabled.
            tabIndex={isDisabled ? -1 : undefined}
            aria-disabled={isDisabled || undefined}
            onClick={handleClick}
            onPointerDown={handlePointerDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
          >
            {children}
          </button>
        ) : (
          <span
            className={triggerStyle}
            onClick={handleClick}
            onPointerDown={handlePointerDown}
          >
            {children}
          </span>
        )}
        {isButton && (
          <VisuallyHidden as="div" id={descriptionId} aria-hidden={true}>
            {label}
          </VisuallyHidden>
        )}
      </span>
    </Tooltip>
  );
};

export default ClickableTooltip;
