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
import {
  css,
  cx,
  SystemStyleObject,
  Tooltip,
  TooltipProps,
  VisuallyHidden,
} from "@microbit/ui";

interface ClickableTooltipProps {
  children: ReactElement;
  /** Tooltip body. */
  label: ReactNode;
  placement?: TooltipProps["placement"];
  hasArrow?: boolean;
  titleId?: string;
  /** Styles for the tooltip itself, e.g. padding for a multi-line body. */
  css?: SystemStyleObject;
  /**
   * @deprecated Renders the tooltip as visual-only: a non-focusable trigger
   * that shows the tooltip on hover/click, reachable by neither keyboard nor
   * screen reader. A temporary escape hatch for RecordingFingerprint's data
   * features until an accessible solution is implemented — don't use it
   * anywhere new.
   */
  deprecatedVisualOnly?: boolean;
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
// The deprecatedVisualOnly prop opts out of all of the above (see its doc
// comment).

// Time allowed to move the pointer off the trigger and onto the tooltip before
// it closes, so the tooltip is hoverable per WCAG 1.4.13. The tooltip unmounts
// when closed, so with an immediate close the pointer can never reach it.
const closeDelayMs = 150;

// How far outside the tooltip the pointer still counts as on it.
const pointerMarginPx = 12;

// One tooltip at a time, as react-aria's own tooltip manager does for
// uncontrolled tooltips: opening one closes any other. Each open instance
// registers its own close function here.
const openTooltips = new Set<() => void>();

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
  deprecatedVisualOnly = false,
  css: cssProp,
}: ClickableTooltipProps) => {
  const isButton = !deprecatedVisualOnly;
  const [isOpen, setOpen] = useState(false);
  const intl = useIntl();
  const ref = useRef<HTMLSpanElement>(null);
  const descriptionId = useId();
  // Identifies our own tooltip among any others in the document.
  const labelId = useId();
  // Distinguishes keyboard focus (should open) from pointer-driven focus (a
  // tap/click, which toggles via onClick instead — otherwise a tap would open
  // on focus and then immediately toggle closed).
  const pointerDownRef = useRef(false);
  // Whether the pointer is over the tooltip. It's portalled, so it isn't part
  // of the trigger for hit-testing or focus purposes.
  const pointerOnTooltipRef = useRef(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const cancelClose = useCallback(() => {
    clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = undefined;
  }, []);
  const hide = useCallback(() => {
    cancelClose();
    setOpen(false);
  }, [cancelClose]);
  const hideAfterDelay = useCallback(() => {
    if (closeTimeoutRef.current) {
      return;
    }
    closeTimeoutRef.current = setTimeout(() => setOpen(false), closeDelayMs);
  }, []);
  const show = useCallback(() => {
    cancelClose();
    openTooltips.forEach((close) => close !== hide && close());
    openTooltips.clear();
    openTooltips.add(hide);
    setOpen(true);
  }, [cancelClose, hide]);
  useEffect(
    () => () => {
      openTooltips.delete(hide);
      cancelClose();
    },
    [cancelClose, hide]
  );

  const handleMouseEnter = show;
  const handleMouseLeave = useCallback(() => {
    // Keep it open while focus is inside the trigger.
    if (!ref.current?.contains(document.activeElement)) {
      hideAfterDelay();
    }
  }, [hideAfterDelay]);
  // Keep it open while the pointer is on or heading for the tooltip, so it can
  // be read at high magnification (WCAG 1.4.13 "hoverable").
  //
  // Deliberately geometry rather than hit-testing: a tooltip opened from inside
  // a modal lands in the app-level overlay container, which react-aria marks
  // `inert` while the modal is open, so it is visible but never the target of a
  // mouse event. The margin covers the trigger/tooltip gap and the arrow, both
  // outside the tooltip's own box.
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const isPointerNearTooltip = (e: MouseEvent) => {
      const rect = document
        .getElementById(labelId)
        ?.closest('[role="tooltip"]')
        ?.getBoundingClientRect();
      return (
        !!rect &&
        e.clientX >= rect.left - pointerMarginPx &&
        e.clientX <= rect.right + pointerMarginPx &&
        e.clientY >= rect.top - pointerMarginPx &&
        e.clientY <= rect.bottom + pointerMarginPx
      );
    };
    const onMouseMove = (e: MouseEvent) => {
      pointerOnTooltipRef.current = isPointerNearTooltip(e);
      if (pointerOnTooltipRef.current) {
        cancelClose();
      } else if (
        !ref.current?.contains(e.target as Node) &&
        !ref.current?.contains(document.activeElement)
      ) {
        hideAfterDelay();
      }
    };
    document.addEventListener("mousemove", onMouseMove);
    return () => document.removeEventListener("mousemove", onMouseMove);
  }, [cancelClose, hideAfterDelay, isOpen, labelId]);
  const handlePointerDown = useCallback(() => {
    pointerDownRef.current = true;
  }, []);
  const handleFocus = useCallback(() => {
    if (!pointerDownRef.current) {
      show();
    }
    pointerDownRef.current = false;
  }, [show]);
  const handleBlur = useCallback(() => {
    pointerDownRef.current = false;
    // Clicking or selecting text in the tooltip blurs the trigger, so stay open
    // while the pointer is on the tooltip itself.
    if (!pointerOnTooltipRef.current) {
      hide();
    }
  }, [hide]);
  const handleClick = useCallback(() => {
    pointerDownRef.current = false;
    if (isOpen) {
      hide();
    } else {
      show();
    }
  }, [hide, isOpen, show]);
  // Close on Escape wherever focus is, like Chakra's closeOnEsc. Capture and
  // stop the event as react-aria's own tooltips do, so dismissing a tooltip
  // inside a dialog doesn't also close the dialog.
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        hide();
      }
    };
    document.addEventListener("keydown", listener, true);
    return () => document.removeEventListener("keydown", listener, true);
  }, [hide, isOpen]);

  const nameProps = titleId
    ? {
        "aria-label": intl.formatMessage({ id: `${titleId}-tooltip-aria` }),
        "aria-describedby": descriptionId,
      }
    : { "aria-labelledby": descriptionId };

  return (
    <Tooltip
      label={
        <div id={labelId} aria-hidden={isButton || undefined}>
          {label}
        </div>
      }
      placement={placement}
      hasArrow={hasArrow}
      isOpen={isOpen}
      triggerRef={ref}
      css={cssProp}
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
