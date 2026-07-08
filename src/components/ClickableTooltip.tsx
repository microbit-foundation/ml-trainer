/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Box,
  Button,
  Flex,
  Tooltip,
  TooltipProps,
  useDisclosure,
} from "@chakra-ui/react";
import { ReactNode, useCallback, useId, useRef } from "react";
import { useIntl } from "react-intl";

interface ClickableTooltipProps extends Omit<TooltipProps, "label"> {
  children: ReactNode;
  titleId?: string;
  label: ReactNode;
}

// Chakra Tooltip doesn't support triggering on mobile/tablets:
// https://github.com/chakra-ui/chakra-ui/issues/2691
//
// Touch screen readers (iPadOS VoiceOver / Android TalkBack) never open the
// tooltip, and even when opened its text is only associated with the trigger
// while open (via aria-describedby that Chakra sets on its cloned child). So the
// text is unreachable on tablets. We instead expose the same text on an
// always-present node that is referenced from the real <button> trigger, so it
// is part of the trigger's accessible name/description regardless of the visual
// tooltip's open state.
//
// The trigger is a real <button> so it is focusable and operable (Enter/Space)
// on every platform, rather than a role="button" span with none of the
// behaviour. Chakra clones the outer <Flex> wrapper (which it needs for
// positioning); that wrapper is a nameless, roleless span, so Chakra stamping
// its own aria-describedby/handlers onto it is inert to assistive tech.

const ClickableTooltip = ({
  children,
  titleId,
  label: tooltipLabel,
  ...rest
}: ClickableTooltipProps) => {
  const disclosure = useDisclosure();
  const intl = useIntl();
  const ref = useRef<HTMLDivElement>(null);
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
      disclosure.onOpen();
    }
  }, [disclosure]);
  const handleMouseLeave = useCallback(() => {
    // Keep it open while focus is inside the trigger.
    if (!ref.current?.contains(document.activeElement)) {
      disclosure.onClose();
    }
  }, [disclosure]);
  const handlePointerDown = useCallback(() => {
    pointerDownRef.current = true;
  }, []);
  const handleFocus = useCallback(() => {
    if (!pointerDownRef.current) {
      disclosure.onOpen();
    }
    pointerDownRef.current = false;
  }, [disclosure]);
  const handleBlur = useCallback(() => {
    pointerDownRef.current = false;
    disclosure.onClose();
  }, [disclosure]);
  const handleClick = useCallback(() => {
    pointerDownRef.current = false;
    disclosure.onToggle();
  }, [disclosure]);
  const handleKeydown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === "Escape") {
        disclosure.onClose();
      }
    },
    [disclosure]
  );

  // With a titleId we use a concise name plus the full label as the description;
  // without one, the full label is the accessible name.
  const nameProps = titleId
    ? {
        "aria-label": intl.formatMessage({ id: `${titleId}-tooltip-aria` }),
        "aria-describedby": descriptionId,
      }
    : { "aria-labelledby": descriptionId };

  return (
    <Tooltip
      isOpen={disclosure.isOpen}
      label={
        // Hide the transient Chakra popup from assistive tech; the sibling
        // description node below is the always-present copy, so this avoids a
        // second announcement via Chakra's open-state aria-describedby.
        <Box aria-hidden={true}>{tooltipLabel}</Box>
      }
      {...rest}
      closeOnEsc={true}
    >
      <Flex
        as="span"
        ref={ref}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Button
          {...nameProps}
          variant="unstyled"
          className="focusable-tooltip"
          onClick={handleClick}
          onPointerDown={handlePointerDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeydown}
          display="flex"
          alignItems="stretch"
          justifyContent="center"
          w="100%"
          h="100%"
          minW={0}
          cursor="pointer"
          borderRadius="50%"
          _focusVisible={{
            boxShadow: "outline",
            outline: "none",
          }}
        >
          {children}
        </Button>
        <Box id={descriptionId} aria-hidden={true} srOnly>
          {tooltipLabel}
        </Box>
      </Flex>
    </Tooltip>
  );
};

export default ClickableTooltip;
