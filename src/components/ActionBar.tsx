import { BoxProps, HStack } from "@chakra-ui/react";
import { ReactNode } from "react";

export interface ActionBarProps extends BoxProps {
  itemsLeft?: ReactNode;
  itemsCenter?: ReactNode;
  itemsRight?: ReactNode;
}

const ActionBar = ({
  itemsLeft,
  itemsCenter,
  itemsRight,
  ...rest
}: ActionBarProps) => {
  return (
    <HStack
      px={5}
      alignItems="center"
      justifyContent="space-between"
      bgColor="brand2.500"
      h="64px"
      minH="64px"
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
  );
};

export default ActionBar;
