/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { BoxProps, HStack, StackProps } from "@chakra-ui/react";
import { ReactNode } from "react";

export interface ActionBarProps extends BoxProps {
  itemsLeft?: ReactNode;
  itemsCenter?: ReactNode;
  itemsRight?: ReactNode;
  itemsLeftProps?: StackProps;
}

const ActionBar = ({
  itemsLeft,
  itemsCenter,
  itemsRight,
  itemsLeftProps,
  ...rest
}: ActionBarProps) => {
  return (
    <HStack
      as="header"
      alignItems="center"
      justifyContent="space-between"
      gap={0}
      sx={{
        // Pad the action bar when it appears under the system status bar.
        "--inset-top": "env(safe-area-inset-top)",
        maxHeight: "calc(64px + var(--inset-top))",
        height: "calc(64px + var(--inset-top))",
        paddingTop: "var(--inset-top)",
        background:
          "linear-gradient(to bottom, var(--chakra-colors-brand2-600) var(--inset-top), var(--chakra-colors-brand2-500) var(--inset-top))",
      }}
      {...rest}
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
  );
};

export default ActionBar;
