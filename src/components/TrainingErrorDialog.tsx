import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
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
        <ModalContent>
          <ModalHeader>
            <FormattedMessage id="content.trainer.failure.header" />
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack gap={3} textAlign="left" w="100%">
              <Text w="100%">
                <FormattedMessage id="content.trainer.failure.body" />
              </Text>
              <Text w="100%" fontWeight="bold">
                <FormattedMessage id="content.trainer.failure.todo" />
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter />
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default TrainingErrorDialog;
