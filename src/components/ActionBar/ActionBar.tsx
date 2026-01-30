/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Box, BoxProps, HStack, StackProps, VStack } from "@chakra-ui/react";
import { ReactNode } from "react";

export interface ActionBarProps extends BoxProps {
  itemsLeft?: ReactNode;
  itemsCenter?: ReactNode;
  itemsRight?: ReactNode;
  itemsLeftProps?: StackProps;
}

/**
 * Overlap between status bar area and ActionBar content area.
 * Reduces visual "double padding" when both have centered content.
 * Only applied when there's a non-zero safe area inset.
 */
const statusBarOverlap = "12px";

const ActionBar = ({
  itemsLeft,
  itemsCenter,
  itemsRight,
  itemsLeftProps,
  ...rest
}: ActionBarProps) => {
  return (
    <VStack
      as="header"
      spacing={0}
      bgColor="brand2.500"
      sx={{
        "--inset-top": "env(safe-area-inset-top)",
      }}
      {...rest}
    >
      {/* Status bar spacer: full inset minus overlap (but never negative) */}
      <Box
        flexShrink={0}
        h={`max(0px, calc(var(--inset-top) - ${statusBarOverlap}))`}
      />
      {/* ActionBar content */}
      <HStack
        alignItems="center"
        justifyContent="space-between"
        gap={0}
        h="64px"
        w="100%"
      >
        <HStack
          flex={`${itemsCenter ? 1 : 4} 0`}
          justifyContent="flex-start"
          {...itemsLeftProps}
        >
          {itemsLeft}
        </HStack>
        {itemsCenter && <HStack justifyContent="center">{itemsCenter}</HStack>}
        <HStack flex="1 0" justifyContent="flex-end">
          {itemsRight}
        </HStack>
      </HStack>
    </VStack>
  );
};

export default ActionBar;
