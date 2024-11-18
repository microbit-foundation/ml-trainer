import {
  Box,
  BoxProps,
  Heading,
  HStack,
  IconButton,
  Stack,
} from "@chakra-ui/react";
import { ReactElement, ReactNode, useCallback, useState } from "react";

interface NewPageChoice extends BoxProps {
  children: ReactNode;
  onClick: () => void;
  icon: ReactElement;
  disabled?: boolean;
  label: string;
}

const NewPageChoice = ({
  disabled,
  children,
  onClick,
  icon,
  label,
  ...props
}: NewPageChoice) => {
  const handleClick = useCallback(() => {
    if (!disabled) {
      onClick();
    }
  }, [disabled, onClick]);
  const [isFocused, setIsFocused] = useState(false);
  return (
    <Box boxShadow="lg" flex="1">
      <HStack
        spacing={0}
        borderRadius="md"
        bgColor="white"
        onClick={handleClick}
        cursor="pointer"
        alignItems="stretch"
        opacity={disabled ? 0.5 : undefined}
        userSelect={disabled ? "none" : undefined}
        transitionDuration="200ms"
        transitionProperty="background-color"
        _hover={{
          bgColor: disabled ? undefined : "brand.50",
        }}
        boxShadow={isFocused ? "outline" : "none"}
        role="group"
        {...props}
      >
        <Stack as="section" py={5} px={5} minH={40} flex="1 1 auto">
          <Heading as="h3" fontSize="xl">
            {label}
          </Heading>
          {children}
        </Stack>
        <Box>
          <IconButton
            w={40}
            isDisabled={disabled}
            aria-label={label}
            bgColor="brand.700"
            color="white"
            height="100%"
            variant="unstyled"
            icon={icon}
            borderInlineEndRadius="md"
            _groupHover={{
              color: disabled ? undefined : "#efedf5",
            }}
            _focusVisible={{
              boxShadow: "none",
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            boxShadow="none"
            _hover={{
              bgColor: "brand.700",
            }}
            _disabled={{
              opacity: 1,
            }}
          />
        </Box>
      </HStack>
    </Box>
  );
};

export default NewPageChoice;
