import { HStack, Text } from "@chakra-ui/react";
import { RiErrorWarningLine } from "react-icons/ri";
import { FormattedMessage } from "react-intl";

const PrototypeVersionWarning = () => {
  return (
    <HStack
      bgColor="gray.800"
      textColor="white"
      px={10}
      py={2}
      w="100%"
      spacing={5}
      justifyContent="center"
      position="sticky"
      top={16}
      zIndex={1}
    >
      <RiErrorWarningLine size={24} color="white" />
      <Text fontWeight="bold">
        <FormattedMessage id="prototype.warning" />
      </Text>
    </HStack>
  );
};

export default PrototypeVersionWarning;
