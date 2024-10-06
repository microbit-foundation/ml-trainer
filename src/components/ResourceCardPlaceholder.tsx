import { AspectRatio, Box, Text, VStack } from "@chakra-ui/react";

const ResourceCardPlaceholder = () => {
  return (
    <Box
      display="flex"
      flexDir="column"
      borderRadius="10px"
      borderWidth={1}
      borderStyle="dashed"
      borderColor="gray.600"
      overflow="hidden"
      position="relative"
      w={64}
    >
      <AspectRatio w="100%" ratio={4 / 3} position="relative">
        <Box />
      </AspectRatio>
      <VStack p={8} spacing={3} alignItems="stretch"></VStack>
      <Text
        position="absolute"
        left="50%"
        top="50%"
        transform="translateX(-50%)"
        mt={-2}
        color="gray.600"
      >
        Coming soon
      </Text>
    </Box>
  );
};

export default ResourceCardPlaceholder;
