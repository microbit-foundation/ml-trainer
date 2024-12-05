/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { BoxProps, Text, VisuallyHidden } from "@chakra-ui/react";

interface PercentageDisplayProps extends BoxProps {
  value: number;
  colorScheme?: string;
  ariaLabel?: string;
}

const PercentageDisplay = ({
  value,
  colorScheme = "gray.600",
  ariaLabel,
  ...rest
}: PercentageDisplayProps) => {
  return (
    <>
      <VisuallyHidden>
        <Text>{ariaLabel}</Text>
      </VisuallyHidden>
      <Text
        bgColor={colorScheme}
        color="white"
        rounded="md"
        textAlign="center"
        fontSize="xl"
        w="60px"
        aria-hidden={!!ariaLabel}
        {...rest}
      >{`${value}%`}</Text>
    </>
  );
};

export default PercentageDisplay;
