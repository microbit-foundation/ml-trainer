import { BoxProps, HStack } from "@chakra-ui/react";
import { ReactNode } from "react";

export type ToolbarVariant = "full-screen" | "primary";

const styles = {
  primary: { bgColor: "green.500", h: "64px", minH: "64px" },
  "full-screen": { bgColor: "gray.500", h: "4rem" },
};

export interface ActionBarProps extends BoxProps {
  itemsLeft?: ReactNode;
  itemsCenter?: ReactNode;
  itemsRight?: ReactNode;
  variant?: ToolbarVariant;
}

const ActionBar = ({
  itemsLeft,
  itemsCenter,
  itemsRight,
  variant = "primary",
  ...rest
}: ActionBarProps) => {
  return (
    <>
      <HStack
        px={5}
        alignItems="center"
        justifyContent="space-between"
        {...styles[variant]}
        {...rest}
      >
        <HStack flex={`${itemsCenter ? 1 : 4} 0`} justifyContent="flex-start">
          {itemsLeft}
        </HStack>
        {itemsCenter && <HStack justifyContent="center">{itemsCenter}</HStack>}
        <HStack flex="1 0" justifyContent="flex-end">
          {itemsRight}
        </HStack>
      </HStack>
    </>
  );
};

export default ActionBar;
