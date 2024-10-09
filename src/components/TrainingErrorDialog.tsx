import {
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  ModalProps,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";

const TrainingErrorDialog = ({ ...rest }: Omit<ModalProps, "children">) => {
  return (
    <Modal motionPreset="none" size="lg" isCentered {...rest}>
      <ModalOverlay>
        <ModalContent p={8}>
          <ModalBody>
            <ModalCloseButton />
            <VStack width="100%" alignItems="left" gap={5}>
              <Heading as="h2" fontSize="xl" fontWeight="bold">
                <FormattedMessage id="content.trainer.failure.header" />
              </Heading>
              <VStack gap={3} textAlign="left" w="100%">
                <Text w="100%">
                  <FormattedMessage id="content.trainer.failure.body" />
                </Text>
                <Text w="100%" fontWeight="bold">
                  <FormattedMessage id="content.trainer.failure.todo" />
                </Text>
              </VStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default TrainingErrorDialog;
