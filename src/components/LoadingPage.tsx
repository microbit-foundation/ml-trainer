import { Flex, VStack } from "@chakra-ui/react";
import ActionBar from "./ActionBar/ActionBar";
import AppLogo from "./AppLogo";
import LoadingAnimation from "./LoadingAnimation";

const LoadingPage = () => {
  return (
    <VStack
      minH="100vh"
      w="100%"
      alignItems="stretch"
      spacing={0}
      bgColor="whitesmoke"
    >
      <VStack zIndex={999} position="sticky" top={0} gap={0}>
        <ActionBar
          w="100%"
          px={{ base: 3, sm: 5 }}
          itemsLeft={
            <AppLogo
              display="inline-flex"
              transform={{ base: "scale(0.8)", sm: "scale(0.93)" }}
            />
          }
          itemsLeftProps={{ width: 0 }}
        />
      </VStack>
      <Flex
        flexGrow={1}
        flexDir="column"
        justifyContent="center"
        alignItems="center"
      >
        <LoadingAnimation />
      </Flex>
    </VStack>
  );
};

export default LoadingPage;
