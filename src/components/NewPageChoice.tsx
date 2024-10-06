import { BoxProps, HStack, IconButton } from "@chakra-ui/react";
import { ReactElement, ReactNode } from "react";

interface GetStartedChoiceProps extends BoxProps {
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
}: GetStartedChoiceProps) => {
  return (
    <HStack
      flex="1"
      spacing={0}
      boxShadow="lg"
      borderRadius="md"
      bgColor="white"
      onClick={onClick}
      cursor="pointer"
      alignItems="stretch"
      opacity={disabled ? 0.5 : undefined}
      _hover={{
        bgColor: disabled ? undefined : "#efedf5",
      }}
      role="group"
      {...props}
    >
      {children}
      <IconButton
        isDisabled={disabled}
        flexGrow={0}
        flexShrink={0}
        flexBasis={40}
        aria-label={label}
        bgColor="brand.700"
        color="white"
        height="100%"
        variant="unstyled"
        icon={icon}
        onClick={onClick}
        borderInlineEndRadius="md"
        _groupHover={{
          color: disabled ? undefined : "#efedf5",
        }}
        _hover={{
          bgColor: "brand.700",
        }}
        _disabled={{
          opacity: 1,
        }}
      />
    </HStack>
  );
};

export default NewPageChoice;
