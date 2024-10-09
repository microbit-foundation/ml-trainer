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
      >{`${Math.round(value * 100)}%`}</Text>
    </>
  );
};

export default PercentageDisplay;
