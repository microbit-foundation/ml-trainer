import { Flex, Tooltip, TooltipProps, useDisclosure } from "@chakra-ui/react";
import { ReactNode } from "react";

interface ClickableTooltipProps extends TooltipProps {
  children: ReactNode;
}

// Chakra Tooltip doesn't support triggering on mobile/tablets:
// https://github.com/chakra-ui/chakra-ui/issues/2691

const ClickableTooltip = ({ children, ...rest }: ClickableTooltipProps) => {
  const label = useDisclosure();
  return (
    <Tooltip isOpen={label.isOpen} {...rest}>
      <Flex
        onMouseEnter={label.onOpen}
        onMouseLeave={label.onClose}
        onClick={label.onOpen}
      >
        {children}
      </Flex>
    </Tooltip>
  );
};

export default ClickableTooltip;
