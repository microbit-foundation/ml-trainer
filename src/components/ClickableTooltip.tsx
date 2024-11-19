import { Flex, Tooltip, TooltipProps } from "@chakra-ui/react";
import { ReactNode } from "react";

interface ClickableTooltipProps extends TooltipProps {
  children: ReactNode;
}

// Chakra Tooltip doesn't support triggering on mobile/tablets:
// https://github.com/chakra-ui/chakra-ui/issues/2691

const ClickableTooltip = ({ children, ...rest }: ClickableTooltipProps) => {
  return (
    <Tooltip {...rest}>
      <Flex>{children}</Flex>
    </Tooltip>
  );
};

export default ClickableTooltip;
