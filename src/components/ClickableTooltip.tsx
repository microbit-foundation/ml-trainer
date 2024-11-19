import { Flex, Tooltip, TooltipProps, useDisclosure } from "@chakra-ui/react";
import { ReactNode, useCallback, useRef } from "react";
import { useIntl } from "react-intl";

interface ClickableTooltipProps extends TooltipProps {
  children: ReactNode;
  isFocusable?: boolean;
  titleId?: string;
}

// Chakra Tooltip doesn't support triggering on mobile/tablets:
// https://github.com/chakra-ui/chakra-ui/issues/2691

const ClickableTooltip = ({
  children,
  isFocusable = false,
  titleId,
  isDisabled,
  ...rest
}: ClickableTooltipProps) => {
  const label = useDisclosure();
  const intl = useIntl();
  const ref = useRef<HTMLDivElement>(null);
  const handleMouseEnter = useCallback(() => {
    const focussedTooltips = Array.from(
      document.querySelectorAll(".focusable-tooltip")
    );
    if (
      focussedTooltips.every((tooltip) => tooltip !== document.activeElement)
    ) {
      label.onOpen();
    }
  }, [label]);
  const handleMouseLeave = useCallback(() => {
    if (
      !isFocusable ||
      (ref.current !== document.activeElement && isFocusable)
    ) {
      label.onClose();
    }
  }, [isFocusable, label]);
  const handleKeydown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        label.onClose();
      }
    },
    [label]
  );
  return (
    <Tooltip isOpen={label.isOpen} {...rest} closeOnEsc={true}>
      <Flex
        as="span"
        aria-label={
          titleId
            ? intl.formatMessage({ id: `${titleId}-tooltip-aria` })
            : undefined
        }
        className={isFocusable ? "focusable-tooltip" : undefined}
        onKeyDown={handleKeydown}
        ref={ref}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={label.onOpen}
        tabIndex={isFocusable && !isDisabled ? 0 : undefined}
        onFocus={isFocusable ? label.onOpen : undefined}
        onBlur={isFocusable ? label.onClose : undefined}
        _focusVisible={{
          boxShadow: "outline",
          outline: "none",
        }}
        borderRadius="50%"
      >
        {children}
      </Flex>
    </Tooltip>
  );
};

export default ClickableTooltip;
