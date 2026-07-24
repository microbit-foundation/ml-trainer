/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { RiFeedbackFill } from "react-icons/ri";
import { FormattedMessage } from "react-intl";
import { Button, Flex, HStack, Text } from "@microbit/ui";
import { useStore } from "../store";

const PreReleaseNotice = () => {
  const feedbackOnOpen = useStore((s) => s.feedbackFormOnOpen);
  return (
    <Flex
      w="100%"
      bgColor="gray.800"
      color="white"
      p={1}
      pl={3}
      pr={3}
      justifyContent="center"
      gap={8}
      as="section"
      aria-label="Release information"
      role="region"
    >
      <Text fontSize="sm" textAlign="center" fontWeight="semibold" p={1}>
        This is a beta version and is subject to change without notice
      </Text>
      <HStack>
        <Button
          leftIcon={<RiFeedbackFill />}
          variant="link"
          size="xs"
          css={{ color: "white", fontWeight: "bold", p: 1 }}
          onPress={feedbackOnOpen}
        >
          <FormattedMessage id="feedback" />
        </Button>
      </HStack>
    </Flex>
  );
};

export default PreReleaseNotice;
