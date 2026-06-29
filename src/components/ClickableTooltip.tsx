/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Box,
  Flex,
  Text,
  Tooltip,
  TooltipProps,
  useDisclosure,
  VisuallyHidden,
} from "@chakra-ui/react";
import { ReactNode, useCallback, useId, useRef } from "react";
import { FormattedMessage } from "react-intl";

interface ClickableTooltipProps extends Omit<TooltipProps, "label"> {
  children: ReactNode;
  isFocusable?: boolean;
  titleId?: string;
  label: ReactNode;
}

// Chakra Tooltip doesn't support triggering on mobile/tablets:
// https://github.com/chakra-ui/chakra-ui/issues/2691

// Touch screen readers (iPadOS VoiceOver / Android TalkBack) don't reliably
// announce content that appears as a side effect of focus, so the tooltip text
// is never read on tablets. We instead render the same label in an
// always-present visually hidden node referenced by aria-describedby, making
// it available at the moment of focus on every platform.

const ClickableTooltip = ({
  children,
  isFocusable = false,
  titleId,
  isDisabled,
  label: tooltipLabel,
  ...rest
}: ClickableTooltipProps) => {
  const disclosure = useDisclosure();
  const ref = useRef<HTMLDivElement>(null);
  const descriptionId = useId();
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
    if (
      !isFocusable ||
      (ref.current !== document.activeElement && isFocusable)
    ) {
      disclosure.onClose();
    }
  }, [isFocusable, disclosure]);
  const handleKeydown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        disclosure.onClose();
      }
    },
    [disclosure]
  );
  return (
    <Tooltip
      isOpen={disclosure.isOpen}
      label={
        // Hide the visible tooltip content from assistive technology, since the
        // visually hidden copy below already conveys it via aria-describedby.
        // This avoids screen readers on desktop announcing the same text twice.
        <Box aria-hidden={true}>{tooltipLabel}</Box>
      }
      {...rest}
      closeOnEsc={true}
    >
      <Flex
        as="span"
        role="button"
        aria-describedby={descriptionId}
        className={isFocusable ? "focusable-tooltip" : undefined}
        onKeyDown={handleKeydown}
        ref={ref}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={disclosure.onToggle}
        tabIndex={isFocusable && !isDisabled ? 0 : undefined}
        onFocus={isFocusable ? disclosure.onOpen : undefined}
        onBlur={isFocusable ? disclosure.onClose : undefined}
        _focusVisible={{
          boxShadow: "outline",
          outline: "none",
        }}
        borderRadius="50%"
      >
        {children}
        <VisuallyHidden id={descriptionId}>
          <Text>
            <FormattedMessage id={`${titleId}-tooltip-aria`} />
          </Text>
          {tooltipLabel}
        </VisuallyHidden>
      </Flex>
    </Tooltip>
  );
};

export default ClickableTooltip;
