/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Box, Flex, HStack } from "@chakra-ui/react";
import { ReactNode } from "react";

interface ModalFooterContentProps {
  /**
   * Content for the left side (links, checkboxes, etc.).
   * Stacks above buttons on mobile.
   */
  leftContent?: ReactNode;
  /**
   * Buttons for the right side.
   */
  children: ReactNode;
}

/**
 * Responsive layout for modal footer content.
 * On desktop: left content and buttons side by side.
 * On mobile: left content stacked above buttons.
 */
const ModalFooterContent = ({
  leftContent,
  children,
}: ModalFooterContentProps) => (
  <Flex
    direction={{ base: "column", md: "row" }}
    justifyContent={leftContent ? "space-between" : "end"}
    alignItems={{ base: "flex-start", md: "center" }}
    gap={{ base: 4, md: 0 }}
    width="100%"
  >
    {leftContent && <Box flexShrink={0}>{leftContent}</Box>}
    <HStack gap={5} justifyContent="end" width={leftContent ? "auto" : "100%"}>
      {children}
    </HStack>
  </Flex>
);

export default ModalFooterContent;
