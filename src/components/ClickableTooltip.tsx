import { Flex, Tooltip, TooltipProps, useDisclosure } from "@chakra-ui/react";
import { ReactNode } from "react";

interface ClickableTooltipProps extends TooltipProps {
  children: ReactNode;
  isFocusable?: boolean;
}

// Chakra Tooltip doesn't support triggering on mobile/tablets:
// https://github.com/chakra-ui/chakra-ui/issues/2691

const ClickableTooltip = ({
  children,
  isFocusable = false,
  ...rest
}: ClickableTooltipProps) => {
  const label = useDisclosure();
  return (
    <Tooltip isOpen={label.isOpen} {...rest}>
      <Flex
        onMouseEnter={label.onOpen}
        onMouseLeave={label.onClose}
        onClick={label.onOpen}
        tabIndex={0}
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
