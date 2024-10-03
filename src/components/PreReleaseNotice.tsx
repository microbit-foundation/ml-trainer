/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Button } from "@chakra-ui/button";
import { Flex, HStack, Text } from "@chakra-ui/layout";
import { useDisclosure } from "@chakra-ui/react";
import { RiFeedbackFill } from "react-icons/ri";
import FeedbackForm from "./FeedbackForm";

const PreReleaseNotice = () => {
  const feedbackDialogDisclosure = useDisclosure();
  return (
    <>
      <FeedbackForm
        isOpen={feedbackDialogDisclosure.isOpen}
        onClose={feedbackDialogDisclosure.onClose}
      />
      <Flex
        bgColor="gray.800"
        color="white"
        p={1}
        pl={3}
        pr={3}
        justifyContent="space-between"
        as="section"
        aria-label="Release information"
        role="region"
      >
        <Text fontSize="sm" textAlign="center" fontWeight="semibold" p={1}>
          Beta release
        </Text>
        <HStack>
          <Button
            leftIcon={<RiFeedbackFill />}
            variant="link"
            color="white"
            colorScheme="whiteAlpha"
            size="xs"
            p={1}
            onClick={feedbackDialogDisclosure.onOpen}
          >
            Feedback
          </Button>
        </HStack>
      </Flex>
    </>
  );
};

export default PreReleaseNotice;
